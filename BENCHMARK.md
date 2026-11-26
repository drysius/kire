# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:59:20 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 781,340 | **Fastest** | `####################` |
| kire | 776,391 | 99.4% | `####################` |
| pug | 688,823 | 88.2% | `##################--` |
| kire_components | 501,389 | 64.2% | `#############-------` |
| nunjucks | 302,601 | 38.7% | `########------------` |
| edge.js | 264,284 | 33.8% | `#######-------------` |
| handlebars | 209,452 | 26.8% | `#####---------------` |
| ejs | 134,601 | 17.2% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 91,674 | **Fastest** | `####################` |
| kire_elements | 89,942 | 98.1% | `####################` |
| pug | 76,121 | 83.0% | `#################---` |
| kire_components | 57,086 | 62.3% | `############--------` |
| edge.js | 36,100 | 39.4% | `########------------` |
| nunjucks | 34,708 | 37.9% | `########------------` |
| handlebars | 24,951 | 27.2% | `#####---------------` |
| ejs | 14,490 | 15.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8,543 | **Fastest** | `####################` |
| kire | 8,100 | 94.8% | `###################-` |
| pug | 6,959 | 81.5% | `################----` |
| kire_components | 5,226 | 61.2% | `############--------` |
| edge.js | 3,708 | 43.4% | `#########-----------` |
| nunjucks | 3,614 | 42.3% | `########------------` |
| handlebars | 2,689 | 31.5% | `######--------------` |
| ejs | 1,433 | 16.8% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 668,432 | **Fastest** | `####################` |
| kire_elements | 521,637 | 78.0% | `################----` |
| kire | 521,500 | 78.0% | `################----` |
| kire_components | 421,850 | 63.1% | `#############-------` |
| edge.js | 215,380 | 32.2% | `######--------------` |
| handlebars | 194,265 | 29.1% | `######--------------` |
| nunjucks | 115,903 | 17.3% | `###-----------------` |
| ejs | 104,615 | 15.7% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 75,694 | **Fastest** | `####################` |
| kire_elements | 56,803 | 75.0% | `###############-----` |
| kire | 56,678 | 74.9% | `###############-----` |
| kire_components | 45,932 | 60.7% | `############--------` |
| edge.js | 28,396 | 37.5% | `########------------` |
| handlebars | 25,759 | 34.0% | `#######-------------` |
| nunjucks | 12,356 | 16.3% | `###-----------------` |
| ejs | 11,037 | 14.6% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 7,687 | **Fastest** | `####################` |
| kire | 5,450 | 70.9% | `##############------` |
| kire_elements | 5,423 | 70.5% | `##############------` |
| kire_components | 4,510 | 58.7% | `############--------` |
| edge.js | 2,893 | 37.6% | `########------------` |
| handlebars | 2,341 | 30.5% | `######--------------` |
| nunjucks | 1,279 | 16.6% | `###-----------------` |
| ejs | 1,125 | 14.6% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 808,004 | **Fastest** | `####################` |
| kire_elements | 799,929 | 99.0% | `####################` |
| kire | 766,413 | 94.9% | `###################-` |
| kire_components | 656,114 | 81.2% | `################----` |
| edge.js | 227,540 | 28.2% | `######--------------` |
| handlebars | 193,885 | 24.0% | `#####---------------` |
| nunjucks | 129,939 | 16.1% | `###-----------------` |
| ejs | 104,079 | 12.9% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 100,657 | **Fastest** | `####################` |
| kire | 97,252 | 96.6% | `###################-` |
| pug | 88,634 | 88.1% | `##################--` |
| kire_components | 77,491 | 77.0% | `###############-----` |
| edge.js | 30,409 | 30.2% | `######--------------` |
| handlebars | 26,815 | 26.6% | `#####---------------` |
| nunjucks | 14,300 | 14.2% | `###-----------------` |
| ejs | 11,069 | 11.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,995 | **Fastest** | `####################` |
| kire_elements | 9,879 | 98.8% | `####################` |
| pug | 9,434 | 94.4% | `###################-` |
| kire_components | 7,697 | 77.0% | `###############-----` |
| edge.js | 3,080 | 30.8% | `######--------------` |
| handlebars | 2,430 | 24.3% | `#####---------------` |
| nunjucks | 1,457 | 14.6% | `###-----------------` |
| ejs | 975 | 9.8% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
