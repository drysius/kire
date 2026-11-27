# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Fri, 27 Nov 2026 05:31:59 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 769,596 | **Fastest** | `####################` |
| kire | 743,088 | 96.6% | `###################-` |
| pug | 674,218 | 87.6% | `##################--` |
| kire_components | 514,195 | 66.8% | `#############-------` |
| nunjucks | 288,305 | 37.5% | `#######-------------` |
| edge.js | 278,886 | 36.2% | `#######-------------` |
| handlebars | 203,790 | 26.5% | `#####---------------` |
| ejs | 84,120 | 10.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 92,141 | **Fastest** | `####################` |
| kire | 86,594 | 94.0% | `###################-` |
| pug | 73,371 | 79.6% | `################----` |
| kire_components | 57,492 | 62.4% | `############--------` |
| edge.js | 39,210 | 42.6% | `#########-----------` |
| nunjucks | 31,213 | 33.9% | `#######-------------` |
| handlebars | 23,047 | 25.0% | `#####---------------` |
| ejs | 9,197 | 10.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,721 | **Fastest** | `####################` |
| kire_elements | 9,266 | 95.3% | `###################-` |
| pug | 7,483 | 77.0% | `###############-----` |
| kire_components | 5,490 | 56.5% | `###########---------` |
| edge.js | 4,242 | 43.6% | `#########-----------` |
| nunjucks | 3,493 | 35.9% | `#######-------------` |
| handlebars | 2,424 | 24.9% | `#####---------------` |
| ejs | 970 | 10.0% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 787,916 | **Fastest** | `####################` |
| kire | 582,761 | 74.0% | `###############-----` |
| kire_elements | 576,850 | 73.2% | `###############-----` |
| kire_components | 485,813 | 61.7% | `############--------` |
| edge.js | 260,057 | 33.0% | `#######-------------` |
| handlebars | 223,542 | 28.4% | `######--------------` |
| nunjucks | 130,412 | 16.6% | `###-----------------` |
| ejs | 127,087 | 16.1% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 91,135 | **Fastest** | `####################` |
| kire | 61,590 | 67.6% | `##############------` |
| kire_elements | 61,214 | 67.2% | `#############-------` |
| kire_components | 50,248 | 55.1% | `###########---------` |
| edge.js | 33,048 | 36.3% | `#######-------------` |
| handlebars | 26,279 | 28.8% | `######--------------` |
| nunjucks | 14,262 | 15.6% | `###-----------------` |
| ejs | 13,508 | 14.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 8,984 | **Fastest** | `####################` |
| kire | 5,781 | 64.3% | `#############-------` |
| kire_elements | 5,317 | 59.2% | `############--------` |
| kire_components | 4,764 | 53.0% | `###########---------` |
| edge.js | 2,634 | 29.3% | `######--------------` |
| handlebars | 2,410 | 26.8% | `#####---------------` |
| nunjucks | 1,400 | 15.6% | `###-----------------` |
| ejs | 1,350 | 15.0% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 871,491 | **Fastest** | `####################` |
| kire_elements | 865,024 | 99.3% | `####################` |
| pug | 821,607 | 94.3% | `###################-` |
| kire_components | 641,792 | 73.6% | `###############-----` |
| edge.js | 246,345 | 28.3% | `######--------------` |
| handlebars | 209,351 | 24.0% | `#####---------------` |
| nunjucks | 127,834 | 14.7% | `###-----------------` |
| ejs | 127,357 | 14.6% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 104,259 | **Fastest** | `####################` |
| kire_elements | 99,309 | 95.3% | `###################-` |
| pug | 96,690 | 92.7% | `###################-` |
| kire_components | 74,536 | 71.5% | `##############------` |
| edge.js | 33,993 | 32.6% | `#######-------------` |
| handlebars | 27,585 | 26.5% | `#####---------------` |
| ejs | 13,947 | 13.4% | `###-----------------` |
| nunjucks | 13,399 | 12.9% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,548 | **Fastest** | `####################` |
| kire_elements | 8,867 | 92.9% | `###################-` |
| pug | 8,573 | 89.8% | `##################--` |
| kire_components | 6,891 | 72.2% | `##############------` |
| edge.js | 2,426 | 25.4% | `#####---------------` |
| handlebars | 1,694 | 17.7% | `####----------------` |
| nunjucks | 1,471 | 15.4% | `###-----------------` |
| ejs | 1,383 | 14.5% | `###-----------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
