# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 16 Feb 2026 14:59:04 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 35.098 | **Fastest** | `████████████████████` |
| kire | 32.522 | 92.7% | `███████████████████░` |
| ejs | 28.187 | 80.3% | `████████████████░░░░` |
| edge.js | 16.998 | 48.4% | `██████████░░░░░░░░░░` |
| nunjucks | 10.447 | 29.8% | `██████░░░░░░░░░░░░░░` |
| handlebars | 3.492 | 9.9% | `██░░░░░░░░░░░░░░░░░░` |
| pug | 1.312 | 3.7% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 14.968 | **Fastest** | `████████████████████` |
| kire | 14.546 | 97.2% | `███████████████████░` |
| ejs | 5.438 | 36.3% | `███████░░░░░░░░░░░░░` |
| edge.js | 4.842 | 32.3% | `██████░░░░░░░░░░░░░░` |
| nunjucks | 3.880 | 25.9% | `█████░░░░░░░░░░░░░░░` |
| handlebars | 1.598 | 10.7% | `██░░░░░░░░░░░░░░░░░░` |
| pug | 769 | 5.1% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 5.106 | **Fastest** | `████████████████████` |
| kire | 4.154 | 81.4% | `████████████████░░░░` |
| edge.js | 1.195 | 23.4% | `█████░░░░░░░░░░░░░░░` |
| nunjucks | 1.168 | 22.9% | `█████░░░░░░░░░░░░░░░` |
| ejs | 669 | 13.1% | `███░░░░░░░░░░░░░░░░░` |
| handlebars | 520 | 10.2% | `██░░░░░░░░░░░░░░░░░░` |
| pug | 389 | 7.6% | `██░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
