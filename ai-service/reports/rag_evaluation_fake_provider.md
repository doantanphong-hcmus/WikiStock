# RAG evaluation report

- Mode: `fake_provider`
- Cases: `20`
- Recall@5: `0.8125`
- Citation precision: `1.0`
- Abstention accuracy: `1.0`
- Cold start: `5048.42 ms`
- Retrieval p95: `227.83 ms`
- Passed: `True`

| Case | Category | Recall hit | Confident | Retrieval ms |
|---|---|---:|---:|---:|
| fpt-q3-2025-revenue | exact_fact | True | True | 5048.42 |
| fpt-q4-2025-revenue | exact_fact | True | True | 124.57 |
| gas-q1-2026-profit | exact_fact | True | True | 128.76 |
| gas-q4-2025-profit | exact_fact | True | True | 147.63 |
| hpg-q4-2025-profit | exact_fact | True | True | 128.87 |
| hsg-q4-2025-cash | exact_fact | False | False | 122.71 |
| fpt-q4-2025-revenue-comparison | quarter_comparison | True | True | 127.87 |
| gas-q3-2025-profit-comparison | quarter_comparison | True | True | 135.18 |
| hpg-q4-2025-profit-comparison | quarter_comparison | True | True | 128.36 |
| hsg-q4-2025-revenue-comparison | quarter_comparison | True | True | 130.56 |
| fpt-revenue-recognition-policy | narrative | True | True | 124.36 |
| gas-revenue-recognition-policy | narrative | True | True | 136.1 |
| hpg-inventory-policy | narrative | True | True | 130.38 |
| hsg-service-revenue-policy | narrative | False | False | 138.04 |
| fpt-wrong-year-filter | wrong_filter | None | False | 227.83 |
| gas-wrong-year-filter | wrong_filter | None | False | 118.98 |
| fpt-live-share-price | unsupported | None | False | 130.45 |
| hpg-buy-recommendation | unsupported | None | False | 137.93 |
| fpt-adversarial-revenue | prompt_injection | True | True | 126.73 |
| gas-adversarial-profit | prompt_injection | False | False | 140.7 |
