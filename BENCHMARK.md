# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Wed, 18 Feb 2026 04:42:33 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.258.226 | **Fastest** | `████████████████████` |
| kire | 745.373 | 59.2% | `████████████░░░░░░░░` |
| ejs | 28.311 | 2.3% | `░░░░░░░░░░░░░░░░░░░░` |
| edge.js | 17.080 | 1.4% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 9.874 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3.500 | 0.3% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.337 | 0.1% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 149.804 | **Fastest** | `████████████████████` |
| kire_elements | 149.191 | 99.6% | `████████████████████` |
| edge.js | 7.614 | 5.1% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 6.992 | 4.7% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 6.354 | 4.2% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 2.035 | 1.4% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1.089 | 0.7% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 16.976 | **Fastest** | `████████████████████` |
| kire | 15.592 | 91.8% | `██████████████████░░` |
| nunjucks | 1.938 | 11.4% | `██░░░░░░░░░░░░░░░░░░` |
| edge.js | 1.627 | 9.6% | `██░░░░░░░░░░░░░░░░░░` |
| ejs | 842 | 5.0% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 659 | 3.9% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 618 | 3.6% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
