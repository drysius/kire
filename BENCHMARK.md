# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Fri, 27 Nov 2026 05:41:50 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 773,906 | **Fastest** | `####################` |
| kire_elements | 771,976 | 99.8% | `####################` |
| pug | 679,936 | 87.9% | `##################--` |
| kire_components | 490,545 | 63.4% | `#############-------` |
| nunjucks | 290,462 | 37.5% | `########------------` |
| edge.js | 260,449 | 33.7% | `#######-------------` |
| handlebars | 209,415 | 27.1% | `#####---------------` |
| ejs | 131,629 | 17.0% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 88,122 | **Fastest** | `####################` |
| kire | 86,950 | 98.7% | `####################` |
| pug | 77,494 | 87.9% | `##################--` |
| kire_components | 56,485 | 64.1% | `#############-------` |
| edge.js | 36,905 | 41.9% | `########------------` |
| nunjucks | 34,931 | 39.6% | `########------------` |
| handlebars | 24,933 | 28.3% | `######--------------` |
| ejs | 14,431 | 16.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,441 | **Fastest** | `####################` |
| kire_elements | 8,595 | 91.0% | `##################--` |
| pug | 7,234 | 76.6% | `###############-----` |
| kire_components | 5,390 | 57.1% | `###########---------` |
| edge.js | 3,659 | 38.8% | `########------------` |
| nunjucks | 3,578 | 37.9% | `########------------` |
| handlebars | 2,607 | 27.6% | `######--------------` |
| ejs | 1,455 | 15.4% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 675,921 | **Fastest** | `####################` |
| kire_elements | 521,118 | 77.1% | `###############-----` |
| kire | 510,427 | 75.5% | `###############-----` |
| kire_components | 427,826 | 63.3% | `#############-------` |
| edge.js | 216,387 | 32.0% | `######--------------` |
| handlebars | 195,541 | 28.9% | `######--------------` |
| nunjucks | 113,795 | 16.8% | `###-----------------` |
| ejs | 101,177 | 15.0% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 74,860 | **Fastest** | `####################` |
| kire_elements | 57,424 | 76.7% | `###############-----` |
| kire | 56,778 | 75.8% | `###############-----` |
| kire_components | 45,174 | 60.3% | `############--------` |
| edge.js | 27,463 | 36.7% | `#######-------------` |
| handlebars | 24,915 | 33.3% | `#######-------------` |
| nunjucks | 12,814 | 17.1% | `###-----------------` |
| ejs | 10,926 | 14.6% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 7,573 | **Fastest** | `####################` |
| kire_elements | 5,478 | 72.3% | `##############------` |
| kire | 5,468 | 72.2% | `##############------` |
| kire_components | 4,459 | 58.9% | `############--------` |
| edge.js | 2,918 | 38.5% | `########------------` |
| handlebars | 2,232 | 29.5% | `######--------------` |
| nunjucks | 1,244 | 16.4% | `###-----------------` |
| ejs | 1,110 | 14.7% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 854,760 | **Fastest** | `####################` |
| pug | 786,184 | 92.0% | `##################--` |
| kire | 784,192 | 91.7% | `##################--` |
| kire_components | 634,356 | 74.2% | `###############-----` |
| edge.js | 223,234 | 26.1% | `#####---------------` |
| handlebars | 187,416 | 21.9% | `####----------------` |
| ejs | 103,794 | 12.1% | `##------------------` |
| nunjucks | 69,458 | 8.1% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 99,227 | **Fastest** | `####################` |
| kire | 95,573 | 96.3% | `###################-` |
| pug | 86,062 | 86.7% | `#################---` |
| kire_components | 72,779 | 73.3% | `###############-----` |
| edge.js | 28,503 | 28.7% | `######--------------` |
| handlebars | 24,386 | 24.6% | `#####---------------` |
| ejs | 11,019 | 11.1% | `##------------------` |
| nunjucks | 7,508 | 7.6% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 10,166 | **Fastest** | `####################` |
| kire_elements | 10,165 | 100.0% | `####################` |
| pug | 9,126 | 89.8% | `##################--` |
| kire_components | 7,511 | 73.9% | `###############-----` |
| edge.js | 3,010 | 29.6% | `######--------------` |
| handlebars | 2,546 | 25.0% | `#####---------------` |
| ejs | 1,130 | 11.1% | `##------------------` |
| nunjucks | 749 | 7.4% | `#-------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
