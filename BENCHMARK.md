# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 29 Jun 2026 19:27:49 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 944,900 | **Fastest** | `####################` |
| kire_elements | 934,326 | 98.9% | `####################` |
| pug | 828,716 | 87.7% | `##################--` |
| kire_components | 681,018 | 72.1% | `##############------` |
| nunjucks | 386,736 | 40.9% | `########------------` |
| edge.js | 304,842 | 32.3% | `######--------------` |
| handlebars | 295,776 | 31.3% | `######--------------` |
| ejs | 82,987 | 8.8% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 137,146 | **Fastest** | `####################` |
| kire_elements | 127,718 | 93.1% | `###################-` |
| pug | 103,970 | 75.8% | `###############-----` |
| kire_components | 96,891 | 70.6% | `##############------` |
| nunjucks | 51,369 | 37.5% | `#######-------------` |
| edge.js | 48,239 | 35.2% | `#######-------------` |
| handlebars | 37,444 | 27.3% | `#####---------------` |
| ejs | 8,589 | 6.3% | `#-------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 15,681 | **Fastest** | `####################` |
| kire | 15,658 | 99.9% | `####################` |
| pug | 11,565 | 73.8% | `###############-----` |
| kire_components | 10,149 | 64.7% | `#############-------` |
| nunjucks | 5,554 | 35.4% | `#######-------------` |
| edge.js | 5,440 | 34.7% | `#######-------------` |
| handlebars | 3,472 | 22.1% | `####----------------` |
| ejs | 911 | 5.8% | `#-------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 1,005,858 | **Fastest** | `####################` |
| kire_elements | 680,668 | 67.7% | `##############------` |
| kire | 643,092 | 63.9% | `#############-------` |
| kire_components | 612,049 | 60.8% | `############--------` |
| edge.js | 301,707 | 30.0% | `######--------------` |
| handlebars | 296,204 | 29.4% | `######--------------` |
| nunjucks | 156,001 | 15.5% | `###-----------------` |
| ejs | 149,965 | 14.9% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 110,243 | **Fastest** | `####################` |
| kire | 80,185 | 72.7% | `###############-----` |
| kire_elements | 79,013 | 71.7% | `##############------` |
| kire_components | 64,938 | 58.9% | `############--------` |
| edge.js | 43,418 | 39.4% | `########------------` |
| handlebars | 37,438 | 34.0% | `#######-------------` |
| nunjucks | 16,347 | 14.8% | `###-----------------` |
| ejs | 15,839 | 14.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 10,783 | **Fastest** | `####################` |
| kire_elements | 7,853 | 72.8% | `###############-----` |
| kire | 7,646 | 70.9% | `##############------` |
| kire_components | 6,661 | 61.8% | `############--------` |
| edge.js | 4,235 | 39.3% | `########------------` |
| handlebars | 3,625 | 33.6% | `#######-------------` |
| nunjucks | 1,675 | 15.5% | `###-----------------` |
| ejs | 1,578 | 14.6% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 1,135,023 | **Fastest** | `####################` |
| kire | 996,792 | 87.8% | `##################--` |
| kire_elements | 973,394 | 85.8% | `#################---` |
| kire_components | 820,153 | 72.3% | `##############------` |
| edge.js | 295,035 | 26.0% | `#####---------------` |
| handlebars | 266,524 | 23.5% | `#####---------------` |
| nunjucks | 174,798 | 15.4% | `###-----------------` |
| ejs | 147,545 | 13.0% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 147,629 | **Fastest** | `####################` |
| kire_elements | 146,248 | 99.1% | `####################` |
| pug | 127,449 | 86.3% | `#################---` |
| kire_components | 120,327 | 81.5% | `################----` |
| edge.js | 41,722 | 28.3% | `######--------------` |
| handlebars | 39,876 | 27.0% | `#####---------------` |
| nunjucks | 20,996 | 14.2% | `###-----------------` |
| ejs | 16,743 | 11.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 15,578 | **Fastest** | `####################` |
| kire | 15,365 | 98.6% | `####################` |
| pug | 14,326 | 92.0% | `##################--` |
| kire_components | 12,603 | 80.9% | `################----` |
| edge.js | 4,343 | 27.9% | `######--------------` |
| handlebars | 3,798 | 24.4% | `#####---------------` |
| nunjucks | 2,184 | 14.0% | `###-----------------` |
| ejs | 1,694 | 10.9% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
