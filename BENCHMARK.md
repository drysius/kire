# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 16 Mar 2026 04:07:58 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 300 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 306.937 | **Fastest** | `####################` |
| kire | 276.243 | 90.0% | `##################--` |
| pug | 222.651 | 72.5% | `###############-----` |
| nunjucks | 103.026 | 33.6% | `#######-------------` |
| ejs | 85.646 | 27.9% | `######--------------` |
| edge.js | 68.575 | 22.3% | `####----------------` |
| handlebars | 24.109 | 7.9% | `##------------------` |

### Scenario: Medium Data (100 items, 120 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 52.708 | **Fastest** | `####################` |
| kire_elements | 51.586 | 97.9% | `####################` |
| pug | 33.769 | 64.1% | `#############-------` |
| nunjucks | 22.368 | 42.4% | `########------------` |
| edge.js | 15.056 | 28.6% | `######--------------` |
| ejs | 6.290 | 11.9% | `##------------------` |
| handlebars | 5.672 | 10.8% | `##------------------` |

### Scenario: Large Data (1000 items, 30 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9.627 | **Fastest** | `####################` |
| kire_elements | 5.496 | 57.1% | `###########---------` |
| pug | 3.569 | 37.1% | `#######-------------` |
| nunjucks | 2.638 | 27.4% | `#####---------------` |
| edge.js | 1.376 | 14.3% | `###-----------------` |
| ejs | 1.088 | 11.3% | `##------------------` |
| handlebars | 711 | 7.4% | `#-------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 300 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 483.325 | **Fastest** | `####################` |
| kire | 409.221 | 84.7% | `#################---` |
| pug | 247.566 | 51.2% | `##########----------` |
| edge.js | 97.043 | 20.1% | `####----------------` |
| nunjucks | 83.754 | 17.3% | `###-----------------` |
| ejs | 82.875 | 17.1% | `###-----------------` |
| handlebars | 38.106 | 7.9% | `##------------------` |

### Scenario: Medium Data (100 items, 120 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 66.808 | **Fastest** | `####################` |
| kire_elements | 64.140 | 96.0% | `###################-` |
| pug | 57.048 | 85.4% | `#################---` |
| edge.js | 15.509 | 23.2% | `#####---------------` |
| nunjucks | 8.933 | 13.4% | `###-----------------` |
| ejs | 8.686 | 13.0% | `###-----------------` |
| handlebars | 7.866 | 11.8% | `##------------------` |

### Scenario: Large Data (1000 items, 30 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 18.215 | **Fastest** | `####################` |
| kire_elements | 14.905 | 81.8% | `################----` |
| pug | 8.057 | 44.2% | `#########-----------` |
| edge.js | 1.765 | 9.7% | `##------------------` |
| handlebars | 1.259 | 6.9% | `#-------------------` |
| nunjucks | 1.230 | 6.8% | `#-------------------` |
| ejs | 873 | 4.8% | `#-------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
