# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:14:48 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 558,043 | **Fastest** | `####################` |
| kire | 551,829 | 98.9% | `####################` |
| pug | 526,003 | 94.3% | `###################-` |
| kire_components | 392,003 | 70.2% | `##############------` |
| edge.js | 209,388 | 37.5% | `########------------` |
| nunjucks | 208,644 | 37.4% | `#######-------------` |
| handlebars | 150,822 | 27.0% | `#####---------------` |
| ejs | 104,258 | 18.7% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 69,878 | **Fastest** | `####################` |
| kire_elements | 67,981 | 97.3% | `###################-` |
| pug | 59,196 | 84.7% | `#################---` |
| kire_components | 45,409 | 65.0% | `#############-------` |
| edge.js | 28,509 | 40.8% | `########------------` |
| nunjucks | 25,478 | 36.5% | `#######-------------` |
| handlebars | 17,452 | 25.0% | `#####---------------` |
| ejs | 11,659 | 16.7% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,061 | **Fastest** | `####################` |
| kire_elements | 6,839 | 96.9% | `###################-` |
| pug | 5,292 | 74.9% | `###############-----` |
| kire_components | 4,623 | 65.5% | `#############-------` |
| edge.js | 2,830 | 40.1% | `########------------` |
| nunjucks | 2,523 | 35.7% | `#######-------------` |
| handlebars | 1,823 | 25.8% | `#####---------------` |
| ejs | 1,109 | 15.7% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 523,316 | **Fastest** | `####################` |
| kire | 385,500 | 73.7% | `###############-----` |
| kire_elements | 380,178 | 72.6% | `###############-----` |
| kire_components | 318,860 | 60.9% | `############--------` |
| edge.js | 160,917 | 30.7% | `######--------------` |
| handlebars | 135,885 | 26.0% | `#####---------------` |
| nunjucks | 81,562 | 15.6% | `###-----------------` |
| ejs | 74,610 | 14.3% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 59,022 | **Fastest** | `####################` |
| kire | 43,816 | 74.2% | `###############-----` |
| kire_elements | 43,490 | 73.7% | `###############-----` |
| kire_components | 35,124 | 59.5% | `############--------` |
| edge.js | 20,245 | 34.3% | `#######-------------` |
| handlebars | 17,113 | 29.0% | `######--------------` |
| nunjucks | 8,677 | 14.7% | `###-----------------` |
| ejs | 8,050 | 13.6% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 5,463 | **Fastest** | `####################` |
| kire | 4,220 | 77.2% | `###############-----` |
| kire_elements | 4,182 | 76.6% | `###############-----` |
| kire_components | 3,420 | 62.6% | `#############-------` |
| edge.js | 2,029 | 37.1% | `#######-------------` |
| handlebars | 1,736 | 31.8% | `######--------------` |
| nunjucks | 874 | 16.0% | `###-----------------` |
| ejs | 805 | 14.7% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 662,827 | **Fastest** | `####################` |
| kire_elements | 646,439 | 97.5% | `####################` |
| pug | 606,594 | 91.5% | `##################--` |
| kire_components | 473,564 | 71.4% | `##############------` |
| edge.js | 173,057 | 26.1% | `#####---------------` |
| handlebars | 139,486 | 21.0% | `####----------------` |
| nunjucks | 93,524 | 14.1% | `###-----------------` |
| ejs | 77,641 | 11.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 77,484 | **Fastest** | `####################` |
| kire | 77,153 | 99.6% | `####################` |
| pug | 66,503 | 85.8% | `#################---` |
| kire_components | 52,805 | 68.1% | `##############------` |
| edge.js | 20,718 | 26.7% | `#####---------------` |
| handlebars | 17,291 | 22.3% | `####----------------` |
| nunjucks | 10,251 | 13.2% | `###-----------------` |
| ejs | 8,261 | 10.7% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,810 | **Fastest** | `####################` |
| kire_elements | 7,782 | 99.6% | `####################` |
| pug | 6,692 | 85.7% | `#################---` |
| kire_components | 5,273 | 67.5% | `##############------` |
| edge.js | 2,182 | 27.9% | `######--------------` |
| handlebars | 1,763 | 22.6% | `#####---------------` |
| nunjucks | 1,044 | 13.4% | `###-----------------` |
| ejs | 840 | 10.8% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
