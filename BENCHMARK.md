# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:22:19 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 990,898 | **Fastest** | `####################` |
| kire_elements | 769,680 | 77.7% | `################----` |
| kire_components | 612,025 | 61.8% | `############--------` |
| pug | 555,021 | 56.0% | `###########---------` |
| edge.js | 299,263 | 30.2% | `######--------------` |
| nunjucks | 218,078 | 22.0% | `####----------------` |
| handlebars | 201,206 | 20.3% | `####----------------` |
| ejs | 93,369 | 9.4% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 88,715 | **Fastest** | `####################` |
| kire_elements | 70,549 | 79.5% | `################----` |
| kire_components | 65,848 | 74.2% | `###############-----` |
| kire | 65,355 | 73.7% | `###############-----` |
| edge.js | 45,155 | 50.9% | `##########----------` |
| nunjucks | 41,344 | 46.6% | `#########-----------` |
| handlebars | 26,012 | 29.3% | `######--------------` |
| ejs | 9,845 | 11.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 12,705 | **Fastest** | `####################` |
| kire_elements | 12,200 | 96.0% | `###################-` |
| pug | 8,816 | 69.4% | `##############------` |
| kire_components | 8,365 | 65.8% | `#############-------` |
| nunjucks | 4,215 | 33.2% | `#######-------------` |
| edge.js | 4,155 | 32.7% | `#######-------------` |
| handlebars | 3,394 | 26.7% | `#####---------------` |
| ejs | 995 | 7.8% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 1,020,770 | **Fastest** | `####################` |
| kire | 706,881 | 69.2% | `##############------` |
| kire_elements | 665,708 | 65.2% | `#############-------` |
| kire_components | 566,451 | 55.5% | `###########---------` |
| edge.js | 300,073 | 29.4% | `######--------------` |
| handlebars | 267,830 | 26.2% | `#####---------------` |
| nunjucks | 154,843 | 15.2% | `###-----------------` |
| ejs | 139,505 | 13.7% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 106,355 | **Fastest** | `####################` |
| kire | 82,529 | 77.6% | `################----` |
| kire_elements | 81,759 | 76.9% | `###############-----` |
| kire_components | 64,975 | 61.1% | `############--------` |
| edge.js | 36,558 | 34.4% | `#######-------------` |
| handlebars | 31,761 | 29.9% | `######--------------` |
| nunjucks | 17,231 | 16.2% | `###-----------------` |
| ejs | 14,822 | 13.9% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 10,390 | **Fastest** | `####################` |
| kire_elements | 7,282 | 70.1% | `##############------` |
| kire | 7,177 | 69.1% | `##############------` |
| kire_components | 6,130 | 59.0% | `############--------` |
| edge.js | 3,811 | 36.7% | `#######-------------` |
| handlebars | 3,641 | 35.0% | `#######-------------` |
| nunjucks | 1,758 | 16.9% | `###-----------------` |
| ejs | 1,470 | 14.1% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 1,108,698 | **Fastest** | `####################` |
| pug | 1,089,144 | 98.2% | `####################` |
| kire_elements | 1,016,077 | 91.6% | `##################--` |
| kire_components | 855,367 | 77.2% | `###############-----` |
| edge.js | 295,370 | 26.6% | `#####---------------` |
| handlebars | 255,789 | 23.1% | `#####---------------` |
| nunjucks | 159,748 | 14.4% | `###-----------------` |
| ejs | 139,969 | 12.6% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 143,936 | **Fastest** | `####################` |
| kire_elements | 137,573 | 95.6% | `###################-` |
| pug | 117,242 | 81.5% | `################----` |
| kire_components | 97,514 | 67.7% | `##############------` |
| handlebars | 37,999 | 26.4% | `#####---------------` |
| edge.js | 37,329 | 25.9% | `#####---------------` |
| nunjucks | 18,623 | 12.9% | `###-----------------` |
| ejs | 14,514 | 10.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 15,083 | **Fastest** | `####################` |
| kire | 14,200 | 94.1% | `###################-` |
| pug | 13,154 | 87.2% | `#################---` |
| kire_components | 10,503 | 69.6% | `##############------` |
| edge.js | 4,172 | 27.7% | `######--------------` |
| handlebars | 3,724 | 24.7% | `#####---------------` |
| nunjucks | 2,104 | 13.9% | `###-----------------` |
| ejs | 1,601 | 10.6% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
