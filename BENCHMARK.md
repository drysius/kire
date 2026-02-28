# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Sat, 28 Feb 2026 10:29:02 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 932.792 | **Fastest** | `████████████████████` |
| kire | 749.603 | 80.4% | `████████████████░░░░` |
| ejs | 27.828 | 3.0% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 17.021 | 1.8% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 10.501 | 1.1% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.466 | 0.4% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.361 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 102.459 | **Fastest** | `████████████████████` |
| kire_elements | 100.844 | 98.4% | `████████████████████` |
| edge.js | 7.952 | 7.8% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 6.924 | 6.8% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.531 | 6.4% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 2.102 | 2.1% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.091 | 1.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 11.398 | **Fastest** | `████████████████████` |
| kire | 11.256 | 98.8% | `████████████████████` |
| nunjucks | 2.022 | 17.7% | `████░░░░░░░░░░░░░░░░` |
| edge.js | 1.782 | 15.6% | `███░░░░░░░░░░░░░░░░░` |
| ejs | 845 | 7.4% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 663 | 5.8% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 606 | 5.3% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
