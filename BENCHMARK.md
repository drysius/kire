# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:42:57 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 611,878 | **Fastest** | `####################` |
| kire_elements | 605,039 | 98.9% | `####################` |
| pug | 543,632 | 88.8% | `##################--` |
| kire_components | 396,229 | 64.8% | `#############-------` |
| nunjucks | 215,388 | 35.2% | `#######-------------` |
| edge.js | 213,166 | 34.8% | `#######-------------` |
| handlebars | 154,538 | 25.3% | `#####---------------` |
| ejs | 107,937 | 17.6% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 70,328 | **Fastest** | `####################` |
| kire_elements | 69,009 | 98.1% | `####################` |
| pug | 60,249 | 85.7% | `#################---` |
| kire_components | 46,377 | 65.9% | `#############-------` |
| edge.js | 28,923 | 41.1% | `########------------` |
| nunjucks | 24,897 | 35.4% | `#######-------------` |
| handlebars | 17,305 | 24.6% | `#####---------------` |
| ejs | 11,673 | 16.6% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 7,296 | **Fastest** | `####################` |
| kire | 6,858 | 94.0% | `###################-` |
| pug | 5,750 | 78.8% | `################----` |
| kire_components | 4,455 | 61.1% | `############--------` |
| edge.js | 2,830 | 38.8% | `########------------` |
| nunjucks | 2,412 | 33.1% | `#######-------------` |
| handlebars | 1,889 | 25.9% | `#####---------------` |
| ejs | 1,175 | 16.1% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 529,408 | **Fastest** | `####################` |
| kire_elements | 386,980 | 73.1% | `###############-----` |
| kire | 386,128 | 72.9% | `###############-----` |
| kire_components | 324,802 | 61.4% | `############--------` |
| edge.js | 159,113 | 30.1% | `######--------------` |
| handlebars | 136,996 | 25.9% | `#####---------------` |
| nunjucks | 80,120 | 15.1% | `###-----------------` |
| ejs | 73,532 | 13.9% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 59,935 | **Fastest** | `####################` |
| kire | 44,301 | 73.9% | `###############-----` |
| kire_elements | 43,675 | 72.9% | `###############-----` |
| kire_components | 35,366 | 59.0% | `############--------` |
| edge.js | 19,771 | 33.0% | `#######-------------` |
| handlebars | 16,344 | 27.3% | `#####---------------` |
| nunjucks | 8,689 | 14.5% | `###-----------------` |
| ejs | 8,051 | 13.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 5,970 | **Fastest** | `####################` |
| kire | 4,220 | 70.7% | `##############------` |
| kire_elements | 4,176 | 69.9% | `##############------` |
| kire_components | 3,445 | 57.7% | `############--------` |
| edge.js | 2,034 | 34.1% | `#######-------------` |
| handlebars | 1,692 | 28.3% | `######--------------` |
| nunjucks | 870 | 14.6% | `###-----------------` |
| ejs | 813 | 13.6% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 696,239 | **Fastest** | `####################` |
| kire_elements | 692,003 | 99.4% | `####################` |
| pug | 614,313 | 88.2% | `##################--` |
| kire_components | 499,201 | 71.7% | `##############------` |
| edge.js | 170,651 | 24.5% | `#####---------------` |
| handlebars | 142,403 | 20.5% | `####----------------` |
| nunjucks | 93,851 | 13.5% | `###-----------------` |
| ejs | 78,369 | 11.3% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 82,080 | **Fastest** | `####################` |
| kire | 78,901 | 96.1% | `###################-` |
| pug | 69,365 | 84.5% | `#################---` |
| kire_components | 55,162 | 67.2% | `#############-------` |
| edge.js | 20,873 | 25.4% | `#####---------------` |
| handlebars | 17,022 | 20.7% | `####----------------` |
| nunjucks | 10,228 | 12.5% | `##------------------` |
| ejs | 8,458 | 10.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8,162 | **Fastest** | `####################` |
| kire | 8,117 | 99.4% | `####################` |
| pug | 7,085 | 86.8% | `#################---` |
| kire_components | 5,318 | 65.2% | `#############-------` |
| edge.js | 2,306 | 28.3% | `######--------------` |
| handlebars | 1,662 | 20.4% | `####----------------` |
| nunjucks | 1,039 | 12.7% | `###-----------------` |
| ejs | 826 | 10.1% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
