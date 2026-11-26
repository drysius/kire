# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 06:10:04 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 585,438 | **Fastest** | `####################` |
| kire_elements | 583,672 | 99.7% | `####################` |
| pug | 481,320 | 82.2% | `################----` |
| kire_components | 381,395 | 65.1% | `#############-------` |
| edge.js | 201,965 | 34.5% | `#######-------------` |
| nunjucks | 200,205 | 34.2% | `#######-------------` |
| handlebars | 145,471 | 24.8% | `#####---------------` |
| ejs | 104,508 | 17.9% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 69,456 | **Fastest** | `####################` |
| kire_elements | 65,343 | 94.1% | `###################-` |
| pug | 56,855 | 81.9% | `################----` |
| kire_components | 43,044 | 62.0% | `############--------` |
| edge.js | 26,576 | 38.3% | `########------------` |
| nunjucks | 24,749 | 35.6% | `#######-------------` |
| handlebars | 13,753 | 19.8% | `####----------------` |
| ejs | 11,425 | 16.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 6,934 | **Fastest** | `####################` |
| kire | 6,420 | 92.6% | `###################-` |
| pug | 5,737 | 82.7% | `#################---` |
| kire_components | 4,085 | 58.9% | `############--------` |
| edge.js | 2,738 | 39.5% | `########------------` |
| nunjucks | 2,445 | 35.3% | `#######-------------` |
| handlebars | 1,827 | 26.3% | `#####---------------` |
| ejs | 1,149 | 16.6% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 456,798 | **Fastest** | `####################` |
| kire | 386,505 | 84.6% | `#################---` |
| kire_elements | 379,659 | 83.1% | `#################---` |
| kire_components | 313,164 | 68.6% | `##############------` |
| edge.js | 158,697 | 34.7% | `#######-------------` |
| handlebars | 137,761 | 30.2% | `######--------------` |
| nunjucks | 79,781 | 17.5% | `###-----------------` |
| ejs | 74,470 | 16.3% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 55,604 | **Fastest** | `####################` |
| kire_elements | 43,508 | 78.2% | `################----` |
| kire | 43,413 | 78.1% | `################----` |
| kire_components | 34,550 | 62.1% | `############--------` |
| edge.js | 19,495 | 35.1% | `#######-------------` |
| handlebars | 16,217 | 29.2% | `######--------------` |
| nunjucks | 8,628 | 15.5% | `###-----------------` |
| ejs | 7,895 | 14.2% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 5,915 | **Fastest** | `####################` |
| kire_elements | 4,214 | 71.2% | `##############------` |
| kire | 4,202 | 71.0% | `##############------` |
| kire_components | 3,364 | 56.9% | `###########---------` |
| edge.js | 1,985 | 33.6% | `#######-------------` |
| handlebars | 1,686 | 28.5% | `######--------------` |
| nunjucks | 872 | 14.7% | `###-----------------` |
| ejs | 787 | 13.3% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 639,414 | **Fastest** | `####################` |
| kire_elements | 630,267 | 98.6% | `####################` |
| pug | 611,385 | 95.6% | `###################-` |
| kire_components | 484,537 | 75.8% | `###############-----` |
| edge.js | 174,791 | 27.3% | `#####---------------` |
| handlebars | 140,240 | 21.9% | `####----------------` |
| nunjucks | 93,241 | 14.6% | `###-----------------` |
| ejs | 76,496 | 12.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 77,362 | **Fastest** | `####################` |
| kire_elements | 74,995 | 96.9% | `###################-` |
| pug | 64,839 | 83.8% | `#################---` |
| kire_components | 56,009 | 72.4% | `##############------` |
| edge.js | 21,784 | 28.2% | `######--------------` |
| handlebars | 18,398 | 23.8% | `#####---------------` |
| nunjucks | 10,403 | 13.4% | `###-----------------` |
| ejs | 8,402 | 10.9% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 7,804 | **Fastest** | `####################` |
| kire | 7,455 | 95.5% | `###################-` |
| pug | 6,697 | 85.8% | `#################---` |
| kire_components | 5,564 | 71.3% | `##############------` |
| edge.js | 2,259 | 28.9% | `######--------------` |
| handlebars | 1,739 | 22.3% | `####----------------` |
| nunjucks | 1,036 | 13.3% | `###-----------------` |
| ejs | 840 | 10.8% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
