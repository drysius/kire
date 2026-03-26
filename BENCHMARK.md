# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Mar 2026 18:56:24 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 713,923 | **Fastest** | `####################` |
| kire | 335,767 | 47.0% | `#########-----------` |
| pug | 257,494 | 36.1% | `#######-------------` |
| kire_components | 203,909 | 28.6% | `######--------------` |
| nunjucks | 151,638 | 21.2% | `####----------------` |
| edge.js | 133,077 | 18.6% | `####----------------` |
| ejs | 86,354 | 12.1% | `##------------------` |
| handlebars | 66,876 | 9.4% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 102,426 | **Fastest** | `####################` |
| kire_elements | 100,923 | 98.5% | `####################` |
| pug | 42,441 | 41.4% | `########------------` |
| kire_components | 30,411 | 29.7% | `######--------------` |
| nunjucks | 22,396 | 21.9% | `####----------------` |
| edge.js | 20,122 | 19.6% | `####----------------` |
| ejs | 9,140 | 8.9% | `##------------------` |
| handlebars | 8,322 | 8.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 11,724 | **Fastest** | `####################` |
| kire | 11,660 | 99.5% | `####################` |
| pug | 4,111 | 35.1% | `#######-------------` |
| kire_components | 3,257 | 27.8% | `######--------------` |
| nunjucks | 2,360 | 20.1% | `####----------------` |
| edge.js | 2,212 | 18.9% | `####----------------` |
| handlebars | 959 | 8.2% | `##------------------` |
| ejs | 882 | 7.5% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 596,545 | **Fastest** | `####################` |
| kire_elements | 532,130 | 89.2% | `##################--` |
| pug | 442,406 | 74.2% | `###############-----` |
| kire_components | 165,555 | 27.8% | `######--------------` |
| edge.js | 110,411 | 18.5% | `####----------------` |
| ejs | 71,432 | 12.0% | `##------------------` |
| nunjucks | 68,662 | 11.5% | `##------------------` |
| handlebars | 65,715 | 11.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 73,251 | **Fastest** | `####################` |
| kire | 64,840 | 88.5% | `##################--` |
| pug | 49,787 | 68.0% | `##############------` |
| kire_components | 31,588 | 43.1% | `#########-----------` |
| edge.js | 13,636 | 18.6% | `####----------------` |
| handlebars | 8,794 | 12.0% | `##------------------` |
| nunjucks | 7,944 | 10.8% | `##------------------` |
| ejs | 7,769 | 10.6% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,039 | **Fastest** | `####################` |
| kire | 8,828 | 97.7% | `####################` |
| pug | 5,720 | 63.3% | `#############-------` |
| kire_components | 3,689 | 40.8% | `########------------` |
| edge.js | 1,579 | 17.5% | `###-----------------` |
| handlebars | 961 | 10.6% | `##------------------` |
| ejs | 780 | 8.6% | `##------------------` |
| nunjucks | 780 | 8.6% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 634,285 | **Fastest** | `####################` |
| kire | 457,139 | 72.1% | `##############------` |
| pug | 425,259 | 67.0% | `#############-------` |
| kire_components | 169,431 | 26.7% | `#####---------------` |
| edge.js | 133,942 | 21.1% | `####----------------` |
| nunjucks | 90,567 | 14.3% | `###-----------------` |
| ejs | 73,557 | 11.6% | `##------------------` |
| handlebars | 69,948 | 11.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 59,003 | **Fastest** | `####################` |
| pug | 53,891 | 91.3% | `##################--` |
| kire_elements | 51,509 | 87.3% | `#################---` |
| kire_components | 29,439 | 49.9% | `##########----------` |
| edge.js | 13,700 | 23.2% | `#####---------------` |
| handlebars | 8,884 | 15.1% | `###-----------------` |
| nunjucks | 7,647 | 13.0% | `###-----------------` |
| ejs | 7,288 | 12.4% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 11,147 | **Fastest** | `####################` |
| kire | 10,770 | 96.6% | `###################-` |
| pug | 5,685 | 51.0% | `##########----------` |
| kire_components | 4,367 | 39.2% | `########------------` |
| edge.js | 1,853 | 16.6% | `###-----------------` |
| handlebars | 1,000 | 9.0% | `##------------------` |
| nunjucks | 994 | 8.9% | `##------------------` |
| ejs | 812 | 7.3% | `#-------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
