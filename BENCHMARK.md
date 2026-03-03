# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Tue, 03 Mar 2026 12:41:29 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.078.597 | **Fastest** | `████████████████████` |
| kire | 730.957 | 67.8% | `██████████████░░░░░░` |
| ejs | 27.658 | 2.6% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 17.042 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 9.827 | 0.9% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.263 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.283 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 118.655 | **Fastest** | `████████████████████` |
| kire | 113.109 | 95.3% | `███████████████████░` |
| edge.js | 7.304 | 6.2% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.921 | 5.8% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 5.762 | 4.9% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1.919 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 992 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 12.390 | **Fastest** | `████████████████████` |
| kire | 11.638 | 93.9% | `███████████████████░` |
| nunjucks | 1.919 | 15.5% | `███░░░░░░░░░░░░░░░░░` |
| edge.js | 1.648 | 13.3% | `███░░░░░░░░░░░░░░░░░` |
| ejs | 776 | 6.3% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 591 | 4.8% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 517 | 4.2% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
