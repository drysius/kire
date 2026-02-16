# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons.

Generated on: Mon, 16 Feb 2026 06:47:41 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| Kire | 31.868 | **Fastest** | `████████████████████` |
| EJS | 28.266 | 88.7% | `██████████████████░░` |
| Edge.js | 17.535 | 55.0% | `███████████░░░░░░░░░` |
| Nunjucks | 10.209 | 32.0% | `██████░░░░░░░░░░░░░░` |
| Handlebars | 3.479 | 10.9% | `██░░░░░░░░░░░░░░░░░░` |
| Pug | 1.369 | 4.3% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| Kire | 20.370 | **Fastest** | `████████████████████` |
| Edge.js | 7.644 | 37.5% | `████████░░░░░░░░░░░░` |
| EJS | 7.115 | 34.9% | `███████░░░░░░░░░░░░░` |
| Nunjucks | 6.383 | 31.3% | `██████░░░░░░░░░░░░░░` |
| Handlebars | 2.002 | 9.8% | `██░░░░░░░░░░░░░░░░░░` |
| Pug | 1.107 | 5.4% | `█░░░░░░░░░░░░░░░░░░░` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| Kire | 6.725 | **Fastest** | `████████████████████` |
| Nunjucks | 2.040 | 30.3% | `██████░░░░░░░░░░░░░░` |
| Edge.js | 1.673 | 24.9% | `█████░░░░░░░░░░░░░░░` |
| EJS | 852 | 12.7% | `███░░░░░░░░░░░░░░░░░` |
| Handlebars | 680 | 10.1% | `██░░░░░░░░░░░░░░░░░░` |
| Pug | 585 | 8.7% | `██░░░░░░░░░░░░░░░░░░` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
