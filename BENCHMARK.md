# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 16 Mar 2026 04:05:48 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 552,024 | **Fastest** | `####################` |
| pug | 343,358 | 62.2% | `############--------` |
| kire | 289,031 | 52.4% | `##########----------` |
| nunjucks | 159,384 | 28.9% | `######--------------` |
| edge.js | 130,692 | 23.7% | `#####---------------` |
| ejs | 82,270 | 14.9% | `###-----------------` |
| handlebars | 74,683 | 13.5% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 65,025 | **Fastest** | `####################` |
| kire | 51,569 | 79.3% | `################----` |
| pug | 37,059 | 57.0% | `###########---------` |
| nunjucks | 20,844 | 32.1% | `######--------------` |
| edge.js | 13,824 | 21.3% | `####----------------` |
| ejs | 9,314 | 14.3% | `###-----------------` |
| handlebars | 7,268 | 11.2% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,177 | **Fastest** | `####################` |
| kire | 5,668 | 61.8% | `############--------` |
| pug | 4,590 | 50.0% | `##########----------` |
| nunjucks | 2,487 | 27.1% | `#####---------------` |
| edge.js | 2,052 | 22.4% | `####----------------` |
| handlebars | 1,232 | 13.4% | `###-----------------` |
| ejs | 839 | 9.1% | `##------------------` |

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
