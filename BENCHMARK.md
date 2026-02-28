# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Sat, 28 Feb 2026 16:55:24 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.074.195 | **Fastest** | `████████████████████` |
| kire | 850.579 | 79.2% | `████████████████░░░░` |
| ejs | 27.564 | 2.6% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 17.650 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 10.402 | 1.0% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.526 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.376 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 124.819 | **Fastest** | `████████████████████` |
| kire | 123.761 | 99.2% | `████████████████████` |
| edge.js | 8.045 | 6.4% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.966 | 5.6% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.481 | 5.2% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 2.016 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.074 | 0.9% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 13.885 | **Fastest** | `████████████████████` |
| kire | 13.577 | 97.8% | `████████████████████` |
| nunjucks | 1.931 | 13.9% | `███░░░░░░░░░░░░░░░░░` |
| edge.js | 1.745 | 12.6% | `███░░░░░░░░░░░░░░░░░` |
| ejs | 859 | 6.2% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 663 | 4.8% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 660 | 4.8% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
