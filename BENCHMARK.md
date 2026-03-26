# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Wed, 25 Mar 2026 21:48:22 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 561,055 | **Fastest** | `####################` |
| kire | 318,675 | 56.8% | `###########---------` |
| pug | 296,304 | 52.8% | `###########---------` |
| kire_components | 190,518 | 34.0% | `#######-------------` |
| nunjucks | 156,898 | 28.0% | `######--------------` |
| edge.js | 126,844 | 22.6% | `#####---------------` |
| ejs | 77,313 | 13.8% | `###-----------------` |
| handlebars | 69,083 | 12.3% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 92,277 | **Fastest** | `####################` |
| kire | 92,192 | 99.9% | `####################` |
| pug | 42,692 | 46.3% | `#########-----------` |
| kire_components | 35,253 | 38.2% | `########------------` |
| nunjucks | 21,477 | 23.3% | `#####---------------` |
| edge.js | 19,671 | 21.3% | `####----------------` |
| ejs | 9,177 | 9.9% | `##------------------` |
| handlebars | 8,857 | 9.6% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11,646 | **Fastest** | `####################` |
| kire_elements | 10,765 | 92.4% | `##################--` |
| pug | 4,493 | 38.6% | `########------------` |
| kire_components | 3,710 | 31.9% | `######--------------` |
| nunjucks | 2,507 | 21.5% | `####----------------` |
| edge.js | 2,439 | 20.9% | `####----------------` |
| handlebars | 1,155 | 9.9% | `##------------------` |
| ejs | 938 | 8.1% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 564,167 | **Fastest** | `####################` |
| kire | 493,949 | 87.6% | `##################--` |
| pug | 427,568 | 75.8% | `###############-----` |
| kire_components | 159,632 | 28.3% | `######--------------` |
| edge.js | 107,544 | 19.1% | `####----------------` |
| nunjucks | 72,460 | 12.8% | `###-----------------` |
| ejs | 71,458 | 12.7% | `###-----------------` |
| handlebars | 65,176 | 11.6% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 66,637 | **Fastest** | `####################` |
| kire_elements | 63,332 | 95.0% | `###################-` |
| pug | 42,171 | 63.3% | `#############-------` |
| kire_components | 26,370 | 39.6% | `########------------` |
| edge.js | 12,332 | 18.5% | `####----------------` |
| handlebars | 8,324 | 12.5% | `##------------------` |
| ejs | 7,063 | 10.6% | `##------------------` |
| nunjucks | 6,940 | 10.4% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,675 | **Fastest** | `####################` |
| kire_elements | 6,096 | 79.4% | `################----` |
| pug | 5,452 | 71.0% | `##############------` |
| kire_components | 3,371 | 43.9% | `#########-----------` |
| edge.js | 1,114 | 14.5% | `###-----------------` |
| handlebars | 855 | 11.1% | `##------------------` |
| nunjucks | 807 | 10.5% | `##------------------` |
| ejs | 554 | 7.2% | `#-------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 616,665 | **Fastest** | `####################` |
| pug | 489,635 | 79.4% | `################----` |
| kire | 332,398 | 53.9% | `###########---------` |
| kire_components | 173,493 | 28.1% | `######--------------` |
| edge.js | 130,172 | 21.1% | `####----------------` |
| nunjucks | 85,857 | 13.9% | `###-----------------` |
| ejs | 74,848 | 12.1% | `##------------------` |
| handlebars | 68,799 | 11.2% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 81,060 | **Fastest** | `####################` |
| kire | 70,877 | 87.4% | `#################---` |
| pug | 58,270 | 71.9% | `##############------` |
| kire_components | 32,972 | 40.7% | `########------------` |
| edge.js | 12,045 | 14.9% | `###-----------------` |
| nunjucks | 9,000 | 11.1% | `##------------------` |
| handlebars | 8,991 | 11.1% | `##------------------` |
| ejs | 8,032 | 9.9% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 10,531 | **Fastest** | `####################` |
| kire | 9,064 | 86.1% | `#################---` |
| pug | 5,577 | 53.0% | `###########---------` |
| kire_components | 3,847 | 36.5% | `#######-------------` |
| edge.js | 1,923 | 18.3% | `####----------------` |
| handlebars | 999 | 9.5% | `##------------------` |
| nunjucks | 927 | 8.8% | `##------------------` |
| ejs | 799 | 7.6% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
