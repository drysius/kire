# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Mar 2026 20:11:22 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 630,522 | **Fastest** | `####################` |
| pug | 350,455 | 55.6% | `###########---------` |
| kire | 321,393 | 51.0% | `##########----------` |
| kire_components | 222,971 | 35.4% | `#######-------------` |
| nunjucks | 162,280 | 25.7% | `#####---------------` |
| edge.js | 133,727 | 21.2% | `####----------------` |
| ejs | 85,046 | 13.5% | `###-----------------` |
| handlebars | 75,818 | 12.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 103,881 | **Fastest** | `####################` |
| kire | 103,756 | 99.9% | `####################` |
| pug | 42,684 | 41.1% | `########------------` |
| kire_components | 36,599 | 35.2% | `#######-------------` |
| nunjucks | 22,370 | 21.5% | `####----------------` |
| edge.js | 20,267 | 19.5% | `####----------------` |
| ejs | 9,331 | 9.0% | `##------------------` |
| handlebars | 8,156 | 7.9% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11,423 | **Fastest** | `####################` |
| kire_elements | 11,395 | 99.8% | `####################` |
| pug | 5,012 | 43.9% | `#########-----------` |
| kire_components | 3,543 | 31.0% | `######--------------` |
| nunjucks | 2,544 | 22.3% | `####----------------` |
| edge.js | 2,209 | 19.3% | `####----------------` |
| handlebars | 1,128 | 9.9% | `##------------------` |
| ejs | 937 | 8.2% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 581,968 | **Fastest** | `####################` |
| kire_elements | 547,478 | 94.1% | `###################-` |
| pug | 342,885 | 58.9% | `############--------` |
| kire_components | 159,953 | 27.5% | `#####---------------` |
| edge.js | 113,593 | 19.5% | `####----------------` |
| ejs | 71,816 | 12.3% | `##------------------` |
| nunjucks | 69,091 | 11.9% | `##------------------` |
| handlebars | 67,084 | 11.5% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 74,743 | **Fastest** | `####################` |
| kire_elements | 67,299 | 90.0% | `##################--` |
| pug | 51,078 | 68.3% | `##############------` |
| kire_components | 30,647 | 41.0% | `########------------` |
| edge.js | 12,458 | 16.7% | `###-----------------` |
| handlebars | 8,640 | 11.6% | `##------------------` |
| nunjucks | 7,984 | 10.7% | `##------------------` |
| ejs | 7,717 | 10.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8,484 | **Fastest** | `####################` |
| kire | 8,376 | 98.7% | `####################` |
| pug | 5,661 | 66.7% | `#############-------` |
| kire_components | 3,600 | 42.4% | `########------------` |
| edge.js | 1,610 | 19.0% | `####----------------` |
| handlebars | 969 | 11.4% | `##------------------` |
| ejs | 779 | 9.2% | `##------------------` |
| nunjucks | 774 | 9.1% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 641,504 | **Fastest** | `####################` |
| pug | 490,786 | 76.5% | `###############-----` |
| kire | 321,066 | 50.0% | `##########----------` |
| kire_components | 174,200 | 27.2% | `#####---------------` |
| edge.js | 124,213 | 19.4% | `####----------------` |
| nunjucks | 89,198 | 13.9% | `###-----------------` |
| ejs | 71,730 | 11.2% | `##------------------` |
| handlebars | 70,159 | 10.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 95,647 | **Fastest** | `####################` |
| kire_elements | 91,402 | 95.6% | `###################-` |
| pug | 47,033 | 49.2% | `##########----------` |
| kire_components | 36,897 | 38.6% | `########------------` |
| edge.js | 13,440 | 14.1% | `###-----------------` |
| handlebars | 8,983 | 9.4% | `##------------------` |
| nunjucks | 8,507 | 8.9% | `##------------------` |
| ejs | 7,731 | 8.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,434 | **Fastest** | `####################` |
| kire | 7,049 | 74.7% | `###############-----` |
| pug | 6,425 | 68.1% | `##############------` |
| kire_components | 3,827 | 40.6% | `########------------` |
| edge.js | 1,662 | 17.6% | `####----------------` |
| nunjucks | 1,036 | 11.0% | `##------------------` |
| handlebars | 997 | 10.6% | `##------------------` |
| ejs | 830 | 8.8% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
