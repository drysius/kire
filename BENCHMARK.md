# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Tue, 17 Feb 2026 04:06:54 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.214.860 | **Fastest** | `████████████████████` |
| kire | 818.967 | 67.4% | `█████████████░░░░░░░` |
| ejs | 28.768 | 2.4% | `░░░░░░░░░░░░░░░░░░░░` |
| edge.js | 16.203 | 1.3% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 9.339 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.056 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.380 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 154.381 | **Fastest** | `████████████████████` |
| kire | 143.647 | 93.0% | `███████████████████░` |
| edge.js | 7.817 | 5.1% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.651 | 4.3% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.317 | 4.1% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1.860 | 1.2% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.124 | 0.7% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 18.403 | **Fastest** | `████████████████████` |
| kire_elements | 18.398 | 100.0% | `████████████████████` |
| nunjucks | 1.899 | 10.3% | `██░░░░░░░░░░░░░░░░░░` |
| edge.js | 1.618 | 8.8% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 767 | 4.2% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 666 | 3.6% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 614 | 3.3% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
