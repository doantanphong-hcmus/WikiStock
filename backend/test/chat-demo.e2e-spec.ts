import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { LoginResponse } from '../src/auth/auth.service';
import type { ApiResponse, Citation } from '../src/common/types/api.types';
import { PrismaService } from '../src/database/prisma.service';

const describeWithDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

interface SseEvent {
  event: string;
  data: Record<string, unknown>;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  relatedCompany: { ticker: string } | null;
  citations: Citation[];
}

function parseSse(body: string): SseEvent[] {
  return body
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter((block) => block.startsWith('event:'))
    .map((block) => {
      const lines = block.split(/\r?\n/);
      const event = lines.find((line) => line.startsWith('event: '));
      const data = lines.find((line) => line.startsWith('data: '));
      return {
        event: event?.slice(7) ?? '',
        data: JSON.parse(data?.slice(6) ?? '{}') as Record<string, unknown>,
      };
    });
}

describeWithDatabase('Hành trình demo chatbot khách hàng (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let documentId: number;
  let chunkId: number;
  let citationId: number;
  const createdUserIds: number[] = [];
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalDemoMode = process.env.AI_DEMO_MODE;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const emailA = `d5-a-${suffix}@example.com`;
  const emailB = `d5-b-${suffix}@example.com`;
  const password = 'WikiStock123';

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'd5-test-secret-with-at-least-32-characters';
    process.env.AI_DEMO_MODE = 'false';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const [company, source, documentType] = await Promise.all([
      prisma.company.findUniqueOrThrow({ where: { ticker: 'FPT' } }),
      prisma.dataSource.findFirstOrThrow(),
      prisma.documentType.findFirstOrThrow(),
    ]);
    const document = await prisma.sourceDocument.create({
      data: {
        companyId: company.companyId,
        sourceId: source.sourceId,
        docTypeId: documentType.docTypeId,
        title: 'Báo cáo tài chính FPT quý 3 - nguồn kiểm thử D5',
        url: `https://example.com/d5-${suffix}.pdf`,
        ingestionStatus: 'ready',
      },
    });
    documentId = document.documentId;
    const chunk = await prisma.documentChunk.create({
      data: {
        documentId,
        chunkIndex: 0,
        pageNumber: 7,
        locationRef: 'Trang 7',
        content:
          'Doanh thu và lợi nhuận sau thuế của FPT trong quý 3 năm 2025.',
        charCount: 64,
        contentHash: `d5${suffix}`
          .replaceAll('-', '')
          .padEnd(64, '0')
          .slice(0, 64),
      },
    });
    chunkId = chunk.chunkId;
    const citation = await prisma.citation.create({
      data: {
        documentId,
        chunkId,
        locationRef: 'Trang 7',
        excerpt: chunk.content,
      },
    });
    citationId = citation.citationId;
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    if (prisma) {
      const conversations = await prisma.aiConversation.findMany({
        where: { userId: { in: createdUserIds } },
        select: { conversationId: true },
      });
      const conversationIds = conversations.map((item) => item.conversationId);
      const messages = await prisma.aiMessage.findMany({
        where: { conversationId: { in: conversationIds } },
        select: { messageId: true },
      });
      await prisma.aiMessageCitation.deleteMany({
        where: { messageId: { in: messages.map((item) => item.messageId) } },
      });
      await prisma.aiMessage.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.aiConversation.deleteMany({
        where: { conversationId: { in: conversationIds } },
      });
      await prisma.appUser.deleteMany({
        where: { userId: { in: createdUserIds } },
      });
      if (citationId) await prisma.citation.delete({ where: { citationId } });
      if (chunkId) await prisma.documentChunk.delete({ where: { chunkId } });
      if (documentId) {
        await prisma.sourceDocument.delete({ where: { documentId } });
      }
    }
    await app?.close();

    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalDemoMode === undefined) delete process.env.AI_DEMO_MODE;
    else process.env.AI_DEMO_MODE = originalDemoMode;
  });

  async function register(email: string, fullName: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, fullName, password })
      .expect(201);
    const userId = (response.body as ApiResponse<{ userId: number }>).data!
      .userId;
    createdUserIds.push(userId);
  }

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return (response.body as ApiResponse<LoginResponse>).data!.accessToken;
  }

  async function stream(
    token: string,
    conversationId: number,
    content: string,
  ) {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationId}/messages/stream`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content, clientRequestId: crypto.randomUUID() })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);
    return parseSse(response.text);
  }

  it('đi từ đăng ký đến hỏi tiếp, đăng nhập lại và giữ lịch sử riêng tư', async () => {
    await register(emailA, 'Khách hàng D5');
    await register(emailB, 'Người dùng khác');

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: emailA, fullName: 'Email trùng', password })
      .expect(409);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: emailA, password: 'SaiMatKhau123' })
      .expect(401);

    const tokenA = await login(emailA);
    const tokenB = await login(emailB);
    const conversationResponse = await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    const conversationId = (
      conversationResponse.body as ApiResponse<{ conversationId: number }>
    ).data!.conversationId;

    const answers = [
      'Doanh thu quý 3 của FPT được ghi nhận trong báo cáo tài chính.',
      'Lợi nhuận sau thuế cùng kỳ của FPT cũng có trong báo cáo này.',
    ];
    const upstreamPayloads: Array<Record<string, unknown>> = [];
    jest.spyOn(global, 'fetch').mockImplementation((_url, init) => {
      if (typeof init?.body !== 'string') {
        throw new Error('AI request body must be JSON text');
      }
      upstreamPayloads.push(JSON.parse(init.body) as Record<string, unknown>);
      const answer = answers[upstreamPayloads.length - 1];
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              answer,
              isConfident: true,
              limitations: null,
              evidence: [{ chunkId, documentId }],
            },
          }),
      } as Response);
    });

    const firstEvents = await stream(
      tokenA,
      conversationId,
      'Doanh thu quý 3 của FPT là bao nhiêu?',
    );
    expect(firstEvents[0].event).toBe('started');
    expect(firstEvents.filter((event) => event.event === 'delta').length).toBe(
      2,
    );
    expect(firstEvents.at(-1)).toMatchObject({
      event: 'completed',
      data: {
        isConfident: true,
        citations: [expect.objectContaining({ citationId, documentId })],
      },
    });

    const followUpEvents = await stream(
      tokenA,
      conversationId,
      'Còn lợi nhuận thì sao?',
    );
    expect(followUpEvents.at(-1)?.event).toBe('completed');
    expect(upstreamPayloads).toHaveLength(2);
    expect(upstreamPayloads.map((payload) => payload.companyCode)).toEqual([
      'FPT',
      'FPT',
    ]);

    const historyResponse = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const history = historyResponse.body as ApiResponse<HistoryMessage[]>;
    expect(history.data?.map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ]);
    expect(
      history.data?.every(
        (message) => message.relatedCompany?.ticker === 'FPT',
      ),
    ).toBe(true);
    expect(history.data?.[1].citations).toEqual([
      expect.objectContaining({ citationId }),
    ]);
    expect(typeof history.data?.[1].citations[0].sourceUrl).toBe('string');

    const tokenAfterLoginAgain = await login(emailA);
    const conversationsResponse = await request(app.getHttpServer())
      .get('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${tokenAfterLoginAgain}`)
      .expect(200);
    expect(conversationsResponse.body).toMatchObject({
      data: [
        expect.objectContaining({
          conversationId,
          title: 'Doanh thu quý 3 của FPT là bao nhiêu?',
          messageCount: 4,
        }),
      ],
    });

    await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
