# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Tue, 03 Mar 2026 20:32:15 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 674,687 | **Fastest** | `████████████████████` |
| kire | 462,762 | 68.6% | `██████████████░░░░░░` |
| ejs | 18,820 | 2.8% | `█░░░░░░░░░░░░░░░░░░░` |
| edge.js | 15,446 | 2.3% | `░░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 8,433 | 1.2% | `░░░░░░░░░░░░░░░░░░░░` |
| handlebars | 3,034 | 0.4% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 1,063 | 0.2% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 104,603 | **Fastest** | `████████████████████` |
| kire | 81,947 | 78.3% | `████████████████░░░░` |
| edge.js | 5,470 | 5.2% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 4,006 | 3.8% | `█░░░░░░░░░░░░░░░░░░░` |
| nunjucks | 3,377 | 3.2% | `█░░░░░░░░░░░░░░░░░░░` |
| handlebars | 1,653 | 1.6% | `░░░░░░░░░░░░░░░░░░░░` |
| pug | 791 | 0.8% | `░░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 12,542 | **Fastest** | `████████████████████` |
| kire | 12,281 | 97.9% | `████████████████████` |
| edge.js | 1,508 | 12.0% | `██░░░░░░░░░░░░░░░░░░` |
| nunjucks | 1,174 | 9.4% | `██░░░░░░░░░░░░░░░░░░` |
| handlebars | 520 | 4.1% | `█░░░░░░░░░░░░░░░░░░░` |
| ejs | 441 | 3.5% | `█░░░░░░░░░░░░░░░░░░░` |
| pug | 388 | 3.1% | `█░░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
