# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Tue, 24 Feb 2026 16:27:57 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 777,056 | **Fastest** | `████████████████████` |
| kire | 412,111 | 53.0% | `███████████░░░░░░░░░` |
| ejs | 22,046 | 2.8% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 12,567 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 112,379 | **Fastest** | `████████████████████` |
| kire | 109,537 | 97.5% | `███████████████████░` |
| ejs | 5,676 | 5.1% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 5,672 | 5.0% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 14,299 | **Fastest** | `████████████████████` |
| kire_elements | 10,442 | 73.0% | `███████████████░░░░░` |
| edge.js | 1,113 | 7.8% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 651 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
