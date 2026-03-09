# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 09 Mar 2026 00:13:03 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 827.924 | **Fastest** | `####################` |
| kire | 786.114 | 95.0% | `###################-` |
| pug | 625.583 | 75.6% | `###############-----` |
| nunjucks | 234.188 | 28.3% | `######--------------` |
| edge.js | 148.487 | 17.9% | `####----------------` |
| ejs | 102.617 | 12.4% | `##------------------` |
| handlebars | 90.469 | 10.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 106.338 | **Fastest** | `####################` |
| kire | 103.751 | 97.6% | `####################` |
| pug | 63.801 | 60.0% | `############--------` |
| nunjucks | 30.990 | 29.1% | `######--------------` |
| edge.js | 22.020 | 20.7% | `####----------------` |
| handlebars | 10.936 | 10.3% | `##------------------` |
| ejs | 10.802 | 10.2% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11.812 | **Fastest** | `####################` |
| kire_elements | 11.758 | 99.5% | `####################` |
| pug | 7.021 | 59.4% | `############--------` |
| nunjucks | 3.317 | 28.1% | `######--------------` |
| edge.js | 2.391 | 20.2% | `####----------------` |
| handlebars | 1.500 | 12.7% | `###-----------------` |
| ejs | 1.089 | 9.2% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.055.053 | **Fastest** | `####################` |
| kire | 907.104 | 86.0% | `#################---` |
| pug | 793.808 | 75.2% | `###############-----` |
| edge.js | 159.984 | 15.2% | `###-----------------` |
| nunjucks | 118.228 | 11.2% | `##------------------` |
| ejs | 97.959 | 9.3% | `##------------------` |
| handlebars | 93.732 | 8.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 141.441 | **Fastest** | `####################` |
| kire_elements | 135.097 | 95.5% | `###################-` |
| pug | 63.519 | 44.9% | `#########-----------` |
| edge.js | 17.574 | 12.4% | `##------------------` |
| nunjucks | 10.919 | 7.7% | `##------------------` |
| ejs | 10.691 | 7.6% | `##------------------` |
| handlebars | 10.457 | 7.4% | `#-------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11.369 | **Fastest** | `####################` |
| kire_elements | 11.144 | 98.0% | `####################` |
| pug | 6.974 | 61.3% | `############--------` |
| edge.js | 1.791 | 15.8% | `###-----------------` |
| handlebars | 1.193 | 10.5% | `##------------------` |
| nunjucks | 1.124 | 9.9% | `##------------------` |
| ejs | 990 | 8.7% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
