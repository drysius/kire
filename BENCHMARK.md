# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 16 Feb 2026 06:11:18 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| Kire | 33.283 | **Fastest** | `████████████████████` |
| EJS | 28.363 | 85.2% | `█████████████████░░░` |
| Edge.js | 17.447 | 52.4% | `██████████░░░░░░░░░░` |
| Nunjucks | 10.238 | 30.8% | `██████░░░░░░░░░░░░░░` |
| Handlebars | 3.460 | 10.4% | `██░░░░░░░░░░░░░░░░░░` |
| Pug | 1.360 | 4.1% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| Kire | 16.464 | **Fastest** | `████████████████████` |
| Edge.js | 7.829 | 47.6% | `██████████░░░░░░░░░░` |
| EJS | 6.812 | 41.4% | `████████░░░░░░░░░░░░` |
| Nunjucks | 6.461 | 39.2% | `████████░░░░░░░░░░░░` |
| Handlebars | 2.074 | 12.6% | `███░░░░░░░░░░░░░░░░░` |
| Pug | 1.136 | 6.9% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| Kire | 6.675 | **Fastest** | `████████████████████` |
| Nunjucks | 1.901 | 28.5% | `██████░░░░░░░░░░░░░░` |
| Edge.js | 1.670 | 25.0% | `█████░░░░░░░░░░░░░░░` |
| EJS | 853 | 12.8% | `███░░░░░░░░░░░░░░░░░` |
| Handlebars | 676 | 10.1% | `██░░░░░░░░░░░░░░░░░░` |
| Pug | 626 | 9.4% | `██░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
