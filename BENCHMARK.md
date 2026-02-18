# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Wed, 18 Feb 2026 16:04:26 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 634,688 | **Fastest** | `████████████████████` |
| kire | 327,129 | 51.5% | `██████████░░░░░░░░░░` |
| ejs | 22,332 | 3.5% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 11,963 | 1.9% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 113,711 | **Fastest** | `████████████████████` |
| kire_elements | 113,012 | 99.4% | `████████████████████` |
| ejs | 5,226 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 5,137 | 4.5% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 13,895 | **Fastest** | `████████████████████` |
| kire_elements | 13,548 | 97.5% | `████████████████████` |
| edge.js | 1,226 | 8.8% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 646 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
