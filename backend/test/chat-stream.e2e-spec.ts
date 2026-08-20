import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
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

describeWithDatabase('Chat AI streaming API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userAId: number;
  let userBId: number;
  let tokenA: string;
  let tokenB: string;
  let documentId: number;
  let chunkId: number;
  let citationId: number;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalDemoMode = process.env.AI_DEMO_MODE;
  const password = 'WikiStock123';
  const suffix = Date.now();
  const emailA = `d3-a-${suffix}@example.com`;
  const emailB = `d3-b-${suffix}@example.com`;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = 'd3-test-secret-with-at-least-32-characters';
    process.env.AI_DEMO_MODE = 'false';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ bodyParser: false });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

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
        title: 'Nguồn kiểm thử streaming D3',
        url: `https://example.com/d3-${suffix}.pdf`,
        ingestionStatus: 'ready',
      },
    });
    documentId = document.documentId;
    const chunk = await prisma.documentChunk.create({
      data: {
        documentId,
        chunkIndex: 0,
        pageNumber: 3,
        locationRef: 'Trang 3',
        content: 'Doanh thu FPT tăng trưởng trong quý 3.',
        charCount: 41,
        contentHash: `d3${suffix}`.padEnd(64, '0'),
      },
    });
    chunkId = chunk.chunkId;
    const citation = await prisma.citation.create({
      data: {
        documentId,
        chunkId,
        locationRef: 'Trang 3',
        excerpt: chunk.content,
      },
    });
    citationId = citation.citationId;

    tokenA = await login(emailA);
    tokenB = await login(emailB);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      if (chunkId) {
        await prisma.documentChunk.deleteMany({ where: { chunkId } });
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
    if (originalDemoMode === undefined) delete process.env.AI_DEMO_MODE;
    else process.env.AI_DEMO_MODE = originalDemoMode;
  });

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const body = response.body as ApiResponse<LoginResponse>;
    return body.data?.accessToken ?? '';
  }

  async function createConversation() {
    const response = await request(app.getHttpServer())
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(201);
    return (response.body as ApiResponse<{ conversationId: number }>).data!
      .conversationId;
  }

  function mockVerifiedAnswer(answer: string) {
    jest.spyOn(global, 'fetch').mockResolvedValue({
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
  }

  it('streams several deltas and persists the complete answer with its citation', async () => {
    const conversationId = await createConversation();
    const answer =
      'Doanh thu quý 3 của FPT tăng trưởng so với cùng kỳ. ' +
      'Kết quả này được đối chiếu từ tài liệu đã lưu trong hệ thống.';
    mockVerifiedAnswer(answer);

    const response = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationId}/messages/stream`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        content: 'Doanh thu quý 3 của FPT là bao nhiêu?',
        clientRequestId: crypto.randomUUID(),
      })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);
    const events = parseSse(response.text);
    const deltas = events.filter((event) => event.event === 'delta');

    expect(events[0].event).toBe('started');
    expect(deltas.length).toBeGreaterThan(1);
    expect(deltas.map((event) => event.data.text).join('')).toBe(answer);
    expect(events.at(-1)).toMatchObject({
      event: 'completed',
      data: {
        isConfident: true,
        citations: [expect.objectContaining({ citationId, documentId })],
      },
    });

    const historyResponse = await request(app.getHttpServer())
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    const history = historyResponse.body as ApiResponse<HistoryMessage[]>;
    expect(history.data?.map((message) => message.role)).toEqual([
      'user',
      'assistant',
    ]);
    expect(history.data?.[1]).toMatchObject({
      content: answer,
      citations: [expect.objectContaining({ citationId })],
    });
  });

  it('keeps ownership errors as normal HTTP responses before opening SSE', async () => {
    const conversationId = await createConversation();

    await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationId}/messages/stream`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Doanh thu FPT?', clientRequestId: crypto.randomUUID() })
      .expect('Content-Type', /json/)
      .expect(404);
  });

  it('returns a safe timeout event and retry does not duplicate the user message', async () => {
    const conversationId = await createConversation();
    const clientRequestId = crypto.randomUUID();
    const timeout = new Error('Private provider timeout details');
    timeout.name = 'TimeoutError';
    jest.spyOn(global, 'fetch').mockRejectedValue(timeout);

    const failedResponse = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationId}/messages/stream`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Doanh thu FPT?', clientRequestId })
      .expect(200);
    const failedEvents = parseSse(failedResponse.text);
    expect(failedEvents.at(-1)).toEqual({
      event: 'error',
      data: {
        code: 'AI_SERVICE_TIMEOUT',
        message: 'AI service timed out',
      },
    });
    expect(failedResponse.text).not.toContain('Private provider timeout');

    jest.restoreAllMocks();
    mockVerifiedAnswer('FPT có dữ liệu doanh thu được xác thực từ báo cáo.');
    const successfulResponse = await request(app.getHttpServer())
      .post(`/api/v1/chat/conversations/${conversationId}/messages/stream`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Doanh thu FPT?', clientRequestId })
      .expect(200);
    expect(parseSse(successfulResponse.text).at(-1)?.event).toBe('completed');

    const messages = await prisma.aiMessage.findMany({
      where: { conversationId },
      select: { role: true, clientRequestId: true },
    });
    expect(
      messages.filter(
        (message) =>
          message.role === 'user' &&
          message.clientRequestId === clientRequestId,
      ),
    ).toHaveLength(1);
    expect(
      messages.filter((message) => message.role === 'assistant'),
    ).toHaveLength(1);
  });
});
