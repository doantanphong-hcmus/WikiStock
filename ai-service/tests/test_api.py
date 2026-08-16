from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import main
from app.models import AiGenerationError, RetrievalError, RetrievalResult
from tests.test_rag_pipeline import FakeClient, chunk


class AiApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(main.app)

    def test_fake_provider_end_to_end_returns_canonical_evidence(self) -> None:
        fake = FakeClient(
            '{"answer":"Doanh thu tăng.","isConfident":true,'
            '"usedChunkIds":[123],"limitations":null}'
        )
        with (
            patch.dict(
                'os.environ',
                {'AI_PROVIDER': 'claude_proxy', 'AI_API_KEY': 'test-key'},
                clear=False,
            ),
            patch(
                'app.rag_pipeline.retrieve_evidence',
                return_value=RetrievalResult(True, (chunk(),), 1.0),
            ),
            patch('app.rag_pipeline.AiGatewayClient', return_value=fake),
        ):
            response = self.client.post(
                '/api/v1/internal/ai/ask',
                json={'query': 'Doanh thu thế nào?', 'companyCode': 'FPT'},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()['data']['evidence'],
            [{'chunkId': 123, 'documentId': 8}],
        )
        self.assertEqual(len(fake.calls), 1)

    def test_provider_failure_never_falls_back_to_demo(self) -> None:
        with (
            patch.dict(
                'os.environ',
                {'AI_PROVIDER': 'claude_proxy', 'AI_API_KEY': 'test-key'},
                clear=False,
            ),
            patch(
                'main.generate_grounded_answer',
                side_effect=AiGenerationError('AI_RATE_LIMITED', 'rate limited'),
            ),
        ):
            response = self.client.post(
                '/api/v1/internal/ai/ask',
                json={'query': 'Question', 'companyCode': 'FPT'},
            )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()['error']['code'], 'AI_RATE_LIMITED')
        self.assertIsNone(response.json()['data'])

    def test_demo_provider_is_explicit_and_non_confident(self) -> None:
        with patch.dict('os.environ', {'AI_PROVIDER': 'demo'}, clear=False):
            response = self.client.post(
                '/api/v1/internal/ai/ask',
                json={'query': 'Question', 'companyCode': 'FPT'},
            )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['data']['isConfident'])
        self.assertEqual(response.json()['data']['evidence'], [])
        self.assertIn('AI_PROVIDER=demo', response.json()['data']['limitations'])

    def test_database_failure_returns_sanitized_service_unavailable(self) -> None:
        with (
            patch.dict(
                'os.environ',
                {'AI_PROVIDER': 'claude_proxy', 'AI_API_KEY': 'test-key'},
                clear=False,
            ),
            patch(
                'main.generate_grounded_answer',
                side_effect=RetrievalError(
                    'DATABASE_UNAVAILABLE', 'RAG database is unavailable'
                ),
            ),
        ):
            response = self.client.post(
                '/api/v1/internal/ai/ask',
                json={'query': 'Question', 'companyCode': 'FPT'},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()['error']['code'], 'DATABASE_UNAVAILABLE'
        )


if __name__ == '__main__':
    unittest.main()
