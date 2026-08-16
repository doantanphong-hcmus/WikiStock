import { PrismaService } from '../database/prisma.service';

interface SchemaState {
  hasVector: boolean;
  companyTable: string | null;
  financialReportTable: string | null;
  documentChunkTable: string | null;
  embeddingType: string | null;
  chunkUniqueIndex: string | null;
}

async function main() {
  const prisma = new PrismaService();
  try {
    const [state] = await prisma.$queryRaw<SchemaState[]>`
      SELECT
        EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS "hasVector",
        to_regclass('public.company')::text AS "companyTable",
        to_regclass('public.financial_report')::text AS "financialReportTable",
        to_regclass('public.document_chunk')::text AS "documentChunkTable",
        (
          SELECT format_type(atttypid, atttypmod)
          FROM pg_attribute
          WHERE attrelid = 'public.document_chunk'::regclass
            AND attname = 'embedding'
            AND NOT attisdropped
        ) AS "embeddingType",
        to_regclass('public.document_chunk_document_id_chunk_index_key')::text AS "chunkUniqueIndex"
    `;

    if (
      !state?.hasVector ||
      !state.companyTable ||
      !state.financialReportTable ||
      !state.documentChunkTable ||
      state.embeddingType !== 'vector(1024)' ||
      !state.chunkUniqueIndex
    ) {
      throw new Error(`Schema check failed: ${JSON.stringify(state)}`);
    }

    console.log(
      'Schema check passed: pgvector, core tables and constraints are ready.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
