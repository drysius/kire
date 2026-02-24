# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Tue, 24 Feb 2026 05:24:29 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.189.061 | **Fastest** | `████████████████████` |
| kire | 798.703 | 67.2% | `█████████████░░░░░░░` |
| ejs | 27.964 | 2.4% | `░░░░░░░░░░░░░░░░░░░░` |
| edge.js | 15.644 | 1.3% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 9.951 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.253 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.302 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 150.866 | **Fastest** | `████████████████████` |
| kire | 147.569 | 97.8% | `████████████████████` |
| edge.js | 7.582 | 5.0% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 7.010 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.189 | 4.1% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1.892 | 1.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.006 | 0.7% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 18.214 | **Fastest** | `████████████████████` |
| kire | 14.110 | 77.5% | `███████████████░░░░░` |
| nunjucks | 1.837 | 10.1% | `██░░░░░░░░░░░░░░░░░░` |
| edge.js | 1.578 | 8.7% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 810 | 4.4% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 607 | 3.3% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 576 | 3.2% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
