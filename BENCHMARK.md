# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 09 Mar 2026 00:26:26 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 848.284 | **Fastest** | `####################` |
| pug | 642.864 | 75.8% | `###############-----` |
| kire | 612.209 | 72.2% | `##############------` |
| nunjucks | 232.757 | 27.4% | `#####---------------` |
| edge.js | 143.529 | 16.9% | `###-----------------` |
| ejs | 101.331 | 11.9% | `##------------------` |
| handlebars | 85.174 | 10.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 107.942 | **Fastest** | `####################` |
| kire | 105.618 | 97.8% | `####################` |
| pug | 65.556 | 60.7% | `############--------` |
| nunjucks | 28.672 | 26.6% | `#####---------------` |
| edge.js | 21.014 | 19.5% | `####----------------` |
| ejs | 10.563 | 9.8% | `##------------------` |
| handlebars | 10.102 | 9.4% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 12.679 | **Fastest** | `####################` |
| kire | 12.209 | 96.3% | `###################-` |
| pug | 6.955 | 54.9% | `###########---------` |
| nunjucks | 3.276 | 25.8% | `#####---------------` |
| edge.js | 2.414 | 19.0% | `####----------------` |
| handlebars | 1.573 | 12.4% | `##------------------` |
| ejs | 1.083 | 8.5% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.054.652 | **Fastest** | `####################` |
| pug | 798.869 | 75.7% | `###############-----` |
| kire | 773.880 | 73.4% | `###############-----` |
| edge.js | 163.181 | 15.5% | `###-----------------` |
| nunjucks | 114.218 | 10.8% | `##------------------` |
| ejs | 92.541 | 8.8% | `##------------------` |
| handlebars | 91.761 | 8.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 148.025 | **Fastest** | `####################` |
| kire | 147.026 | 99.3% | `####################` |
| pug | 89.431 | 60.4% | `############--------` |
| edge.js | 20.173 | 13.6% | `###-----------------` |
| nunjucks | 13.077 | 8.8% | `##------------------` |
| handlebars | 12.350 | 8.3% | `##------------------` |
| ejs | 10.196 | 6.9% | `#-------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 15.729 | **Fastest** | `####################` |
| kire | 15.671 | 99.6% | `####################` |
| pug | 8.807 | 56.0% | `###########---------` |
| edge.js | 2.227 | 14.2% | `###-----------------` |
| nunjucks | 1.346 | 8.6% | `##------------------` |
| handlebars | 1.277 | 8.1% | `##------------------` |
| ejs | 997 | 6.3% | `#-------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
