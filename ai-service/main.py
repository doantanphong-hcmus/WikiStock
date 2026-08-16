from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.config import AiSettings
from app.models import AiGenerationError, GeneratedAnswer, RetrievalError
from app.rag_pipeline import generate_grounded_answer

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


class Evidence(BaseModel):
    chunkId: int
    documentId: int


class AskData(BaseModel):
    answer: str
    isConfident: bool
    evidence: list[Evidence] = Field(default_factory=list)
    limitations: str | None = None


def build_demo_answer(payload: AskRequest) -> AskData:
    company_code = (payload.companyCode or payload.ticker or 'UNKNOWN').upper()
    query = payload.query or payload.question or 'No question provided'

    return AskData(
        answer=(
            f'Demo AI answer for {company_code}: "{query}". '
            'This response does not call retrieval or an AI provider.'
        ),
        isConfident=False,
        evidence=[],
        limitations='AI_PROVIDER=demo is enabled; this answer is demonstration data.',
    )


def build_grounded_answer(payload: AskRequest) -> AskData:
    query = payload.query or payload.question or ''
    company_code = payload.companyCode or payload.ticker or ''
    filters = payload.filters or AskFilters()
    result: GeneratedAnswer = generate_grounded_answer(
        query,
        company_code,
        filters.year,
        filters.documentTypes,
    )
    return AskData(
        answer=result.answer,
        isConfident=result.is_confident,
        evidence=[
            Evidence(chunkId=item.chunk_id, documentId=item.document_id)
            for item in result.evidence
        ],
        limitations=result.limitations,
    )


def run_answer(payload: AskRequest) -> AskData:
    settings = AiSettings.from_env()
    if settings.provider == 'demo':
        return build_demo_answer(payload)
    return build_grounded_answer(payload)


def error_response(error: RetrievalError | AiGenerationError) -> JSONResponse:
    if isinstance(error, RetrievalError):
        if error.code == 'UNKNOWN_COMPANY_CODE':
            status_code = 404
        elif error.code == 'DATABASE_UNAVAILABLE':
            status_code = 503
        else:
            status_code = 400
        message = 'RAG retrieval failed'
    else:
        status_code = 504 if error.code in {'AI_CONNECT_TIMEOUT', 'AI_READ_TIMEOUT'} else 502
        message = 'AI generation failed'
    return JSONResponse(
        status_code=status_code,
        content={
            'statusCode': status_code,
            'message': message,
            'data': None,
            'error': {'code': error.code, 'details': str(error)},
        },
    )


@app.get('/health')
def read_health():
    return {'status': 'ok'}


@app.post('/api/v1/internal/ai/ask')
def ask_internal(payload: AskRequest) -> Any:
    try:
        data = run_answer(payload)
    except (RetrievalError, AiGenerationError) as error:
        return error_response(error)
    return {
        'statusCode': 200,
        'message': 'AI Generated Answer Successfully',
        'data': data.model_dump(),
        'error': None,
    }


@app.post('/ask')
def ask(payload: AskRequest) -> Any:
    try:
        return run_answer(payload).model_dump()
    except (RetrievalError, AiGenerationError) as error:
        return error_response(error)
