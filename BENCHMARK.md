# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 16 Feb 2026 18:31:42 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 31.044 | **Fastest** | `████████████████████` |
| ejs | 27.921 | 89.9% | `██████████████████░░` |
| kire | 27.868 | 89.8% | `██████████████████░░` |
| edge.js | 17.600 | 56.7% | `███████████░░░░░░░░░` |
| nunjucks | 10.089 | 32.5% | `██████░░░░░░░░░░░░░░` |
| handlebars | 3.509 | 11.3% | `██░░░░░░░░░░░░░░░░░░` |
| pug | 1.337 | 4.3% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 19.814 | **Fastest** | `████████████████████` |
| kire_elements | 19.560 | 98.7% | `████████████████████` |
| edge.js | 7.420 | 37.4% | `███████░░░░░░░░░░░░░` |
| ejs | 6.882 | 34.7% | `███████░░░░░░░░░░░░░` |
| nunjucks | 6.073 | 30.7% | `██████░░░░░░░░░░░░░░` |
| handlebars | 2.002 | 10.1% | `██░░░░░░░░░░░░░░░░░░` |
| pug | 1.118 | 5.6% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 7.945 | **Fastest** | `████████████████████` |
| kire | 6.862 | 86.4% | `█████████████████░░░` |
| nunjucks | 1.801 | 22.7% | `█████░░░░░░░░░░░░░░░` |
| edge.js | 1.611 | 20.3% | `████░░░░░░░░░░░░░░░░` |
| ejs | 829 | 10.4% | `██░░░░░░░░░░░░░░░░░░` |
| handlebars | 669 | 8.4% | `██░░░░░░░░░░░░░░░░░░` |
| pug | 653 | 8.2% | `██░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
