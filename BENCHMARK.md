# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 16 Feb 2026 22:38:31 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.094.212 | **Fastest** | `████████████████████` |
| kire | 746.943 | 68.3% | `██████████████░░░░░░` |
| ejs | 26.625 | 2.4% | `░░░░░░░░░░░░░░░░░░░░` |
| edge.js | 16.511 | 1.5% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 9.595 | 0.9% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.319 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.276 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 151.508 | **Fastest** | `████████████████████` |
| kire | 148.247 | 97.8% | `████████████████████` |
| edge.js | 7.096 | 4.7% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.923 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.069 | 4.0% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1.910 | 1.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.008 | 0.7% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 17.465 | **Fastest** | `████████████████████` |
| kire | 16.872 | 96.6% | `███████████████████░` |
| nunjucks | 1.877 | 10.7% | `██░░░░░░░░░░░░░░░░░░` |
| edge.js | 1.406 | 8.1% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 829 | 4.7% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 631 | 3.6% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 517 | 3.0% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
