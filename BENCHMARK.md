# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Thu, 26 Feb 2026 09:09:23 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 652,027 | **Fastest** | `████████████████████` |
| kire | 297,522 | 45.6% | `█████████░░░░░░░░░░░` |
| ejs | 22,662 | 3.5% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 12,520 | 1.9% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 90,143 | **Fastest** | `████████████████████` |
| kire_elements | 81,192 | 90.1% | `██████████████████░░` |
| ejs | 5,652 | 6.3% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 5,583 | 6.2% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 10,611 | **Fastest** | `████████████████████` |
| kire_elements | 10,235 | 96.5% | `███████████████████░` |
| edge.js | 1,257 | 11.8% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 690 | 6.5% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
