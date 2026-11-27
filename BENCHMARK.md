# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Fri, 27 Nov 2026 05:44:00 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 537,953 | **Fastest** | `####################` |
| pug | 527,356 | 98.0% | `####################` |
| kire_elements | 517,639 | 96.2% | `###################-` |
| kire_components | 361,037 | 67.1% | `#############-------` |
| edge.js | 206,072 | 38.3% | `########------------` |
| nunjucks | 186,765 | 34.7% | `#######-------------` |
| handlebars | 147,950 | 27.5% | `######--------------` |
| ejs | 63,376 | 11.8% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 69,915 | **Fastest** | `####################` |
| kire | 66,001 | 94.4% | `###################-` |
| pug | 58,714 | 84.0% | `#################---` |
| kire_components | 43,482 | 62.2% | `############--------` |
| edge.js | 29,548 | 42.3% | `########------------` |
| nunjucks | 24,634 | 35.2% | `#######-------------` |
| handlebars | 17,694 | 25.3% | `#####---------------` |
| ejs | 6,768 | 9.7% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,612 | **Fastest** | `####################` |
| kire_elements | 7,579 | 99.6% | `####################` |
| pug | 5,518 | 72.5% | `##############------` |
| kire_components | 4,973 | 65.3% | `#############-------` |
| edge.js | 3,047 | 40.0% | `########------------` |
| nunjucks | 2,536 | 33.3% | `#######-------------` |
| handlebars | 1,991 | 26.2% | `#####---------------` |
| ejs | 711 | 9.3% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 508,704 | **Fastest** | `####################` |
| kire | 377,227 | 74.2% | `###############-----` |
| kire_elements | 370,533 | 72.8% | `###############-----` |
| kire_components | 313,468 | 61.6% | `############--------` |
| edge.js | 174,086 | 34.2% | `#######-------------` |
| handlebars | 149,901 | 29.5% | `######--------------` |
| nunjucks | 92,728 | 18.2% | `####----------------` |
| ejs | 90,901 | 17.9% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 62,849 | **Fastest** | `####################` |
| kire | 42,975 | 68.4% | `##############------` |
| kire_elements | 41,258 | 65.6% | `#############-------` |
| kire_components | 35,066 | 55.8% | `###########---------` |
| edge.js | 22,992 | 36.6% | `#######-------------` |
| handlebars | 17,266 | 27.5% | `#####---------------` |
| nunjucks | 10,163 | 16.2% | `###-----------------` |
| ejs | 9,686 | 15.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 6,122 | **Fastest** | `####################` |
| kire | 4,263 | 69.6% | `##############------` |
| kire_elements | 4,204 | 68.7% | `##############------` |
| kire_components | 3,567 | 58.3% | `############--------` |
| edge.js | 2,286 | 37.3% | `#######-------------` |
| handlebars | 1,507 | 24.6% | `#####---------------` |
| ejs | 994 | 16.2% | `###-----------------` |
| nunjucks | 956 | 15.6% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 625,411 | **Fastest** | `####################` |
| kire_elements | 624,307 | 99.8% | `####################` |
| pug | 546,761 | 87.4% | `#################---` |
| kire_components | 472,773 | 75.6% | `###############-----` |
| edge.js | 163,986 | 26.2% | `#####---------------` |
| handlebars | 122,559 | 19.6% | `####----------------` |
| nunjucks | 102,720 | 16.4% | `###-----------------` |
| ejs | 97,290 | 15.6% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 71,472 | **Fastest** | `####################` |
| kire_elements | 71,190 | 99.6% | `####################` |
| pug | 66,511 | 93.1% | `###################-` |
| kire_components | 54,979 | 76.9% | `###############-----` |
| edge.js | 22,404 | 31.3% | `######--------------` |
| handlebars | 15,148 | 21.2% | `####----------------` |
| nunjucks | 11,614 | 16.2% | `###-----------------` |
| ejs | 10,644 | 14.9% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 7,328 | **Fastest** | `####################` |
| kire | 7,247 | 98.9% | `####################` |
| pug | 6,659 | 90.9% | `##################--` |
| kire_components | 5,548 | 75.7% | `###############-----` |
| edge.js | 2,173 | 29.7% | `######--------------` |
| handlebars | 1,513 | 20.6% | `####----------------` |
| nunjucks | 1,167 | 15.9% | `###-----------------` |
| ejs | 1,077 | 14.7% | `###-----------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
