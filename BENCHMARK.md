# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:02:36 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1,097,527 | **Fastest** | `####################` |
| kire | 1,005,775 | 91.6% | `##################--` |
| pug | 847,336 | 77.2% | `###############-----` |
| kire_components | 677,196 | 61.7% | `############--------` |
| nunjucks | 395,079 | 36.0% | `#######-------------` |
| edge.js | 355,894 | 32.4% | `######--------------` |
| handlebars | 269,088 | 24.5% | `#####---------------` |
| ejs | 96,953 | 8.8% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 117,060 | **Fastest** | `####################` |
| pug | 104,474 | 89.2% | `##################--` |
| kire_elements | 99,002 | 84.6% | `#################---` |
| kire_components | 81,922 | 70.0% | `##############------` |
| edge.js | 49,211 | 42.0% | `########------------` |
| nunjucks | 48,131 | 41.1% | `########------------` |
| handlebars | 31,540 | 26.9% | `#####---------------` |
| ejs | 10,495 | 9.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 13,124 | **Fastest** | `####################` |
| kire_elements | 12,127 | 92.4% | `##################--` |
| pug | 9,830 | 74.9% | `###############-----` |
| kire_components | 7,172 | 54.6% | `###########---------` |
| edge.js | 4,860 | 37.0% | `#######-------------` |
| nunjucks | 4,845 | 36.9% | `#######-------------` |
| handlebars | 3,371 | 25.7% | `#####---------------` |
| ejs | 1,086 | 8.3% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 951,674 | **Fastest** | `####################` |
| kire | 726,808 | 76.4% | `###############-----` |
| kire_elements | 665,514 | 69.9% | `##############------` |
| kire_components | 544,525 | 57.2% | `###########---------` |
| edge.js | 300,063 | 31.5% | `######--------------` |
| handlebars | 281,276 | 29.6% | `######--------------` |
| nunjucks | 157,627 | 16.6% | `###-----------------` |
| ejs | 145,680 | 15.3% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 114,438 | **Fastest** | `####################` |
| kire_elements | 84,498 | 73.8% | `###############-----` |
| kire | 79,902 | 69.8% | `##############------` |
| kire_components | 66,804 | 58.4% | `############--------` |
| edge.js | 40,361 | 35.3% | `#######-------------` |
| handlebars | 37,307 | 32.6% | `#######-------------` |
| nunjucks | 18,780 | 16.4% | `###-----------------` |
| ejs | 15,827 | 13.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 11,182 | **Fastest** | `####################` |
| kire | 7,853 | 70.2% | `##############------` |
| kire_elements | 7,760 | 69.4% | `##############------` |
| kire_components | 6,297 | 56.3% | `###########---------` |
| edge.js | 4,128 | 36.9% | `#######-------------` |
| handlebars | 3,629 | 32.5% | `######--------------` |
| nunjucks | 1,821 | 16.3% | `###-----------------` |
| ejs | 1,621 | 14.5% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 1,117,745 | **Fastest** | `####################` |
| kire | 1,062,317 | 95.0% | `###################-` |
| kire_elements | 888,362 | 79.5% | `################----` |
| kire_components | 771,940 | 69.1% | `##############------` |
| edge.js | 286,700 | 25.6% | `#####---------------` |
| handlebars | 278,226 | 24.9% | `#####---------------` |
| nunjucks | 150,265 | 13.4% | `###-----------------` |
| ejs | 148,090 | 13.2% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 140,787 | **Fastest** | `####################` |
| kire | 138,122 | 98.1% | `####################` |
| pug | 127,337 | 90.4% | `##################--` |
| kire_components | 101,267 | 71.9% | `##############------` |
| edge.js | 41,579 | 29.5% | `######--------------` |
| handlebars | 36,651 | 26.0% | `#####---------------` |
| nunjucks | 17,015 | 12.1% | `##------------------` |
| ejs | 15,613 | 11.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 15,842 | **Fastest** | `####################` |
| kire_elements | 15,750 | 99.4% | `####################` |
| pug | 13,623 | 86.0% | `#################---` |
| kire_components | 10,500 | 66.3% | `#############-------` |
| edge.js | 4,233 | 26.7% | `#####---------------` |
| handlebars | 3,675 | 23.2% | `#####---------------` |
| nunjucks | 1,740 | 11.0% | `##------------------` |
| ejs | 1,642 | 10.4% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
