# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 16 Mar 2026 03:52:52 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 581,310 | **Fastest** | `####################` |
| pug | 388,969 | 66.9% | `#############-------` |
| kire | 290,938 | 50.0% | `##########----------` |
| nunjucks | 143,238 | 24.6% | `#####---------------` |
| edge.js | 131,926 | 22.7% | `#####---------------` |
| ejs | 87,662 | 15.1% | `###-----------------` |
| handlebars | 62,293 | 10.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 79,728 | **Fastest** | `####################` |
| kire | 79,148 | 99.3% | `####################` |
| pug | 43,385 | 54.4% | `###########---------` |
| nunjucks | 22,737 | 28.5% | `######--------------` |
| edge.js | 19,230 | 24.1% | `#####---------------` |
| ejs | 9,409 | 11.8% | `##------------------` |
| handlebars | 9,243 | 11.6% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 10,130 | **Fastest** | `####################` |
| kire | 9,665 | 95.4% | `###################-` |
| pug | 4,966 | 49.0% | `##########----------` |
| nunjucks | 2,573 | 25.4% | `#####---------------` |
| edge.js | 2,257 | 22.3% | `####----------------` |
| handlebars | 1,290 | 12.7% | `###-----------------` |
| ejs | 941 | 9.3% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
