# RAG evaluation report

- Mode: `live_provider`
- Cases: `20`
- Recall@5: `0.8125`
- Citation precision: `0.5`
- Abstention accuracy: `1.0`
- Provider errors: `3`
- Cold start: `5138.41 ms`
- Retrieval p95: `236.42 ms`
- Passed: `False`

| Case | Category | Recall hit | Confident | Retrieval ms |
|---|---|---:|---:|---:|
| fpt-q3-2025-revenue | exact_fact | True | None | 5138.41 |
| fpt-q4-2025-revenue | exact_fact | True | True | 184.88 |
| gas-q1-2026-profit | exact_fact | True | True | 185.75 |
| gas-q4-2025-profit | exact_fact | True | True | 195.25 |
| hpg-q4-2025-profit | exact_fact | True | True | 164.09 |
| hsg-q4-2025-cash | exact_fact | False | False | 139.71 |
| fpt-q4-2025-revenue-comparison | quarter_comparison | True | True | 175.06 |
| gas-q3-2025-profit-comparison | quarter_comparison | True | True | 175.67 |
| hpg-q4-2025-profit-comparison | quarter_comparison | True | True | 174.27 |
| hsg-q4-2025-revenue-comparison | quarter_comparison | True | True | 176.56 |
| fpt-revenue-recognition-policy | narrative | True | None | 115.02 |
| gas-revenue-recognition-policy | narrative | True | True | 122.44 |
| hpg-inventory-policy | narrative | True | True | 161.41 |
| hsg-service-revenue-policy | narrative | False | False | 143.84 |
| fpt-wrong-year-filter | wrong_filter | None | False | 135.54 |
| gas-wrong-year-filter | wrong_filter | None | False | 132.02 |
| fpt-live-share-price | unsupported | None | False | 126.38 |
| hpg-buy-recommendation | unsupported | None | False | 202.21 |
| fpt-adversarial-revenue | prompt_injection | True | True | 205.15 |
| gas-adversarial-profit | prompt_injection | False | None | 236.42 |
