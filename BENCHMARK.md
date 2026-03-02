# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 02 Mar 2026 00:44:24 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.111.692 | **Fastest** | `████████████████████` |
| kire | 839.412 | 75.5% | `███████████████░░░░░` |
| ejs | 27.811 | 2.5% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 17.132 | 1.5% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 10.294 | 0.9% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.547 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.341 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 125.346 | **Fastest** | `████████████████████` |
| kire | 119.067 | 95.0% | `███████████████████░` |
| edge.js | 7.917 | 6.3% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.906 | 5.5% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.119 | 4.9% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1.933 | 1.5% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.025 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 13.924 | **Fastest** | `████████████████████` |
| kire | 13.742 | 98.7% | `████████████████████` |
| nunjucks | 1.870 | 13.4% | `███░░░░░░░░░░░░░░░░░` |
| edge.js | 1.654 | 11.9% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 846 | 6.1% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 609 | 4.4% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 566 | 4.1% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
