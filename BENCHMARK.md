# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 02 Mar 2026 01:25:15 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.103.862 | **Fastest** | `████████████████████` |
| kire | 874.263 | 79.2% | `████████████████░░░░` |
| ejs | 28.208 | 2.6% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 16.900 | 1.5% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 10.038 | 0.9% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.316 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.322 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 124.299 | **Fastest** | `████████████████████` |
| kire | 120.207 | 96.7% | `███████████████████░` |
| edge.js | 7.549 | 6.1% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.650 | 5.4% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 5.944 | 4.8% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1.944 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.055 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 13.487 | **Fastest** | `████████████████████` |
| kire_elements | 12.791 | 94.8% | `███████████████████░` |
| nunjucks | 1.880 | 13.9% | `███░░░░░░░░░░░░░░░░░` |
| edge.js | 1.648 | 12.2% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 826 | 6.1% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 622 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 576 | 4.3% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
