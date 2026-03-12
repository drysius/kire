# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 12 Mar 2026 03:40:41 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 659.805 | **Fastest** | `####################` |
| kire | 520.676 | 78.9% | `################----` |
| pug | 518.441 | 78.6% | `################----` |
| nunjucks | 159.112 | 24.1% | `#####---------------` |
| edge.js | 102.413 | 15.5% | `###-----------------` |
| ejs | 91.596 | 13.9% | `###-----------------` |
| handlebars | 60.623 | 9.2% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 93.434 | **Fastest** | `####################` |
| kire | 73.197 | 78.3% | `################----` |
| pug | 53.537 | 57.3% | `###########---------` |
| nunjucks | 25.464 | 27.3% | `#####---------------` |
| edge.js | 16.965 | 18.2% | `####----------------` |
| ejs | 10.533 | 11.3% | `##------------------` |
| handlebars | 7.992 | 8.6% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8.940 | **Fastest** | `####################` |
| kire | 7.192 | 80.4% | `################----` |
| pug | 3.439 | 38.5% | `########------------` |
| nunjucks | 2.965 | 33.2% | `#######-------------` |
| edge.js | 1.685 | 18.8% | `####----------------` |
| handlebars | 1.021 | 11.4% | `##------------------` |
| ejs | 937 | 10.5% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 777.768 | **Fastest** | `####################` |
| pug | 668.682 | 86.0% | `#################---` |
| kire | 642.789 | 82.6% | `#################---` |
| nunjucks | 104.080 | 13.4% | `###-----------------` |
| ejs | 91.622 | 11.8% | `##------------------` |
| edge.js | 91.416 | 11.8% | `##------------------` |
| handlebars | 73.883 | 9.5% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 104.481 | **Fastest** | `####################` |
| kire_elements | 103.228 | 98.8% | `####################` |
| pug | 61.995 | 59.3% | `############--------` |
| edge.js | 12.495 | 12.0% | `##------------------` |
| nunjucks | 10.410 | 10.0% | `##------------------` |
| ejs | 8.903 | 8.5% | `##------------------` |
| handlebars | 7.874 | 7.5% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9.691 | **Fastest** | `####################` |
| kire_elements | 8.900 | 91.8% | `##################--` |
| pug | 5.637 | 58.2% | `############--------` |
| edge.js | 1.591 | 16.4% | `###-----------------` |
| nunjucks | 1.123 | 11.6% | `##------------------` |
| handlebars | 1.052 | 10.9% | `##------------------` |
| ejs | 888 | 9.2% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
