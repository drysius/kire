# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Tue, 24 Feb 2026 17:03:09 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 667,965 | **Fastest** | `████████████████████` |
| kire | 369,441 | 55.3% | `███████████░░░░░░░░░` |
| ejs | 21,546 | 3.2% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 13,229 | 2.0% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 112,793 | **Fastest** | `████████████████████` |
| kire | 112,418 | 99.7% | `████████████████████` |
| ejs | 5,365 | 4.8% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 4,963 | 4.4% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 13,956 | **Fastest** | `████████████████████` |
| kire | 12,954 | 92.8% | `███████████████████░` |
| edge.js | 1,076 | 7.7% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 667 | 4.8% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
