import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { LoginResponse } from '../src/auth/auth.service';
import {
  ChatService,
  type ConversationSummary,
  type CreatedUserMessage,
} from '../src/chat/chat.service';
import type { ApiResponse, Citation } from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface HistoryMessage {
  messageId: number;
  role: 'user' | 'assistant';
  content: string;
  relatedCompany: {
    companyId: number;
    ticker: string;
    companyName: string;
  } | null;
  citations: Citation[];
}

describeWithDatabase('Chat history API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let chatService: ChatService;
  let userAId: number;
  let userBId: number;
  let tokenA: string;
  let tokenB: string;
  let conversationAId: number;
  let conversationWithoutCompanyId: number;
  let documentId: number;
  let citationId: number;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;
  const password = 'WikiStock123';
  const suffix = Date.now();
  const emailA = `d2-a-${suffix}@example.com`;
  const emailB = `d2-b-${suffix}@example.com`;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'd2-test-secret-with-at-least-32-characters';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    chatService = app.get(ChatService);

    const [role, company, source, documentType] = await Promise.all([
      prisma.userRole.findUniqueOrThrow({ where: { roleName: 'user' } }),
      prisma.company.findUniqueOrThrow({ where: { ticker: 'FPT' } }),
      prisma.dataSource.findFirstOrThrow(),
      prisma.documentType.findFirstOrThrow(),
    ]);
    const passwordHash = await hash(password, 4);
    const [userA, userB] = await Promise.all([
      prisma.appUser.create({
        data: { email: emailA, passwordHash, roleId: role.roleId },
      }),
      prisma.appUser.create({
        data: { email: emailB, passwordHash, roleId: role.roleId },
      }),
    ]);
    userAId = userA.userId;
    userBId = userB.userId;

    const document = await prisma.sourceDocument.create({
      data: {
        companyId: company.companyId,
        sourceId: source.sourceId,
        docTypeId: documentType.docTypeId,
        title: 'D2 citation fixture',
        url: `https://example.com/d2-${suffix}.pdf`,
        ingestionStatus: 'ready',
      },
    });
    documentId = document.documentId;
    const citation = await prisma.citation.create({
      data: {
        documentId,
        locationRef: 'Trang 1',
        excerpt: 'Dữ liệu kiểm thử D2',
      },
    });
    citationId = citation.citationId;

    tokenA = await login(emailA);
    tokenB = await login(emailB);
  });

  afterAll(async () => {
    if (prisma) {
      const conversations = await prisma.aiConversation.findMany({
        where: { userId: { in: [userAId, userBId].filter(Boolean) } },
        select: { conversationId: true },
      });
      const conversationIds = conversations.map(
        (conversation) => conversation.conversationId,
      );
      const messages = await prisma.aiMessage.findMany({
        where: { conversationId: { in: conversationIds } },
        select: { messageId: true },
      });
      await prisma.aiMessageCitation.deleteMany({
        where: {
          messageId: { in: messages.map((message) => message.messageId) },
        },
      });
      await prisma.aiMessage.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.aiConversation.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      if (citationId) {
        await prisma.citation.deleteMany({ where: { citationId } });
      }
      if (documentId) {
        await prisma.sourceDocument.deleteMany({ where: { documentId } });
      }
      await prisma.appUser.deleteMany({
        where: { userId: { in: [userAId, userBId].filter(Boolean) } },
      });
    }
    await app?.close();

    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  });

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const body = response.body as ApiResponse<LoginResponse>;
    return body.data?.accessToken ?? '';
  }

  it('yêu cầu đăng nhập và tạo hội thoại thuộc đúng người dùng', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .expect(401);

    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    const body = response.body as ApiResponse<ConversationSummary>;
    conversationAId = body.data?.conversationId ?? 0;
    expect(conversationAId).toBeGreaterThan(0);

    const stored = await prisma.aiConversation.findUniqueOrThrow({
      where: { conversationId: conversationAId },
    });
    expect(stored.userId).toBe(userAId);
  });

  it('không cho người dùng khác đọc hoặc ghi vào hội thoại', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${conversationAId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationAId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Doanh thu FPT là bao nhiêu?' })
      .expect(404);
  });

  it('nhận diện FPT và dùng lại doanh nghiệp cho câu hỏi nối tiếp', async () => {
    const firstResponse = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationAId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Doanh thu quý 3 của FPT là bao nhiêu?' })
      .expect(201);
    const firstBody = firstResponse.body as ApiResponse<CreatedUserMessage>;
    expect(firstBody.data?.relatedCompany?.ticker).toBe('FPT');

    const followUpResponse = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationAId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Còn quý trước thì sao?' })
      .expect(201);
    const followUpBody =
      followUpResponse.body as ApiResponse<CreatedUserMessage>;
    expect(followUpBody.data?.relatedCompany?.ticker).toBe('FPT');
  });

  it('yêu cầu làm rõ khi hội thoại chưa có doanh nghiệp', async () => {
    const conversationResponse = await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    const conversationBody =
      conversationResponse.body as ApiResponse<ConversationSummary>;
    conversationWithoutCompanyId = conversationBody.data?.conversationId ?? 0;

    const messageResponse = await request(app.getHttpServer())
      .post(
        `/api/v1/chat/conversations/${conversationWithoutCompanyId}/messages`,
      )
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Doanh thu quý gần nhất là bao nhiêu?' })
      .expect(201);
    const messageBody = messageResponse.body as ApiResponse<CreatedUserMessage>;
    expect(messageBody.data?.relatedCompany).toBeNull();
    expect(messageBody.data?.clarification).toBe(
      'Bạn muốn hỏi về doanh nghiệp nào?',
    );
  });

  it('lưu câu trả lời hoàn chỉnh và citation rồi tải lại đúng thứ tự', async () => {
    const company = await prisma.company.findUniqueOrThrow({
      where: { ticker: 'FPT' },
    });
    await chatService.saveAssistantMessage(userAId, conversationAId, {
      content: 'Đây là câu trả lời hoàn chỉnh.',
      relatedCompanyId: company.companyId,
      modelUsed: 'd2-test-model',
      citationIds: [citationId, citationId],
    });

    const response = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${conversationAId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const body = response.body as ApiResponse<HistoryMessage[]>;

    expect(body.data?.map((message) => message.role)).toEqual([
      'user',
      'user',
      'assistant',
    ]);
    expect(body.data?.at(-1)?.citations).toHaveLength(1);
    expect(body.data?.at(-1)?.citations[0]).toMatchObject({
      citationId,
      docTitle: 'D2 citation fixture',
    });
  });

  it('đăng nhập lại vẫn đọc được lịch sử và danh sách sắp theo cập nhật mới nhất', async () => {
    const freshToken = await login(emailA);
    const historyResponse = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${conversationAId}/messages`)
      .set('Authorization', `Bearer ${freshToken}`)
      .expect(200);
    const historyBody = historyResponse.body as ApiResponse<HistoryMessage[]>;
    expect(historyBody.data).toHaveLength(3);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${freshToken}`)
      .expect(200);
    const listBody = listResponse.body as ApiResponse<ConversationSummary[]>;
    expect(listBody.data?.[0]).toMatchObject({
      conversationId: conversationAId,
      title: 'Doanh thu quý 3 của FPT là bao nhiêu?',
      messageCount: 3,
    });
  });
});
