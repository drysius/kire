# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 16 Feb 2026 21:18:26 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.233.761 | **Fastest** | `████████████████████` |
| kire | 781.342 | 63.3% | `█████████████░░░░░░░` |
| ejs | 27.673 | 2.2% | `░░░░░░░░░░░░░░░░░░░░` |
| edge.js | 16.972 | 1.4% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 10.318 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.473 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.358 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 147.942 | **Fastest** | `████████████████████` |
| kire_elements | 133.615 | 90.3% | `██████████████████░░` |
| edge.js | 7.682 | 5.2% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.886 | 4.7% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.272 | 4.2% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 2.019 | 1.4% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.100 | 0.7% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 17.899 | **Fastest** | `████████████████████` |
| kire_elements | 17.718 | 99.0% | `████████████████████` |
| nunjucks | 1.810 | 10.1% | `██░░░░░░░░░░░░░░░░░░` |
| edge.js | 1.622 | 9.1% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 826 | 4.6% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 639 | 3.6% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 626 | 3.5% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
