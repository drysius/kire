# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Wed, 18 Feb 2026 15:16:42 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.330.176 | **Fastest** | `████████████████████` |
| kire | 772.433 | 58.1% | `████████████░░░░░░░░` |
| ejs | 27.362 | 2.1% | `░░░░░░░░░░░░░░░░░░░░` |
| edge.js | 16.848 | 1.3% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 10.355 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.391 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.354 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 153.210 | **Fastest** | `████████████████████` |
| kire | 149.466 | 97.6% | `████████████████████` |
| edge.js | 7.160 | 4.7% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.966 | 4.5% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.063 | 4.0% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 2.032 | 1.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.096 | 0.7% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 17.795 | **Fastest** | `████████████████████` |
| kire | 16.574 | 93.1% | `███████████████████░` |
| nunjucks | 1.928 | 10.8% | `██░░░░░░░░░░░░░░░░░░` |
| edge.js | 1.617 | 9.1% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 837 | 4.7% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 667 | 3.7% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 596 | 3.3% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
