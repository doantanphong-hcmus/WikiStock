from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title='WikiStock AI Service')


class AskFilters(BaseModel):
    year: int | None = None
    documentTypes: list[str] = Field(default_factory=list)


class AskRequest(BaseModel):
    query: str | None = None
    question: str | None = None
    companyCode: str | None = None
    ticker: str | None = None
    filters: AskFilters | None = None
    context: str | None = None
    conversationId: str | None = None


class Citation(BaseModel):
    id: str
    docTitle: str
    sourceUrl: str
    pageNumber: int
    matchedText: str


class AskData(BaseModel):
    answer: str
    isConfident: bool
    citations: list[Citation] = Field(default_factory=list)
    limitations: str


def build_demo_answer(payload: AskRequest) -> AskData:
    company_code = (payload.companyCode or payload.ticker or 'UNKNOWN').upper()
    query = payload.query or payload.question or 'No question provided'

    return AskData(
        answer=(
            f'Demo AI answer for {company_code}: "{query}". '
            'RAG pipeline and vector search are not connected in this skeleton.'
        ),
        isConfident=False,
        citations=[],
        limitations='Local ai-service skeleton only; no real model, database, or vector store is connected.',
    )


@app.get('/health')
def read_health():
    return {'status': 'ok'}


@app.post('/api/v1/internal/ai/ask')
def ask_internal(payload: AskRequest) -> dict[str, Any]:
    data = build_demo_answer(payload)
    return {
        'statusCode': 200,
        'message': 'AI Generated Answer Successfully',
        'data': data.model_dump(),
        'error': None,
    }


@app.post('/ask')
def ask(payload: AskRequest) -> dict[str, Any]:
    return build_demo_answer(payload).model_dump()
