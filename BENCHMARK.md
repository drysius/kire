# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 06:25:22 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 768,913 | **Fastest** | `####################` |
| kire | 756,175 | 98.3% | `####################` |
| pug | 675,718 | 87.9% | `##################--` |
| kire_components | 500,205 | 65.1% | `#############-------` |
| nunjucks | 290,145 | 37.7% | `########------------` |
| edge.js | 265,419 | 34.5% | `#######-------------` |
| handlebars | 209,604 | 27.3% | `#####---------------` |
| ejs | 112,341 | 14.6% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 90,780 | **Fastest** | `####################` |
| kire_elements | 87,708 | 96.6% | `###################-` |
| pug | 77,465 | 85.3% | `#################---` |
| kire_components | 56,684 | 62.4% | `############--------` |
| nunjucks | 34,854 | 38.4% | `########------------` |
| edge.js | 34,612 | 38.1% | `########------------` |
| handlebars | 23,862 | 26.3% | `#####---------------` |
| ejs | 12,054 | 13.3% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8,747 | **Fastest** | `####################` |
| kire | 8,400 | 96.0% | `###################-` |
| pug | 7,316 | 83.6% | `#################---` |
| kire_components | 5,664 | 64.8% | `#############-------` |
| edge.js | 3,606 | 41.2% | `########------------` |
| nunjucks | 3,250 | 37.2% | `#######-------------` |
| handlebars | 2,511 | 28.7% | `######--------------` |
| ejs | 1,180 | 13.5% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 666,211 | **Fastest** | `####################` |
| kire | 522,833 | 78.5% | `################----` |
| kire_elements | 520,864 | 78.2% | `################----` |
| kire_components | 418,115 | 62.8% | `#############-------` |
| edge.js | 213,588 | 32.1% | `######--------------` |
| handlebars | 189,487 | 28.4% | `######--------------` |
| nunjucks | 115,928 | 17.4% | `###-----------------` |
| ejs | 101,537 | 15.2% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 76,036 | **Fastest** | `####################` |
| kire_elements | 57,054 | 75.0% | `###############-----` |
| kire | 56,989 | 75.0% | `###############-----` |
| kire_components | 46,591 | 61.3% | `############--------` |
| edge.js | 28,566 | 37.6% | `########------------` |
| handlebars | 25,200 | 33.1% | `#######-------------` |
| nunjucks | 12,782 | 16.8% | `###-----------------` |
| ejs | 11,058 | 14.5% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 7,682 | **Fastest** | `####################` |
| kire_elements | 5,462 | 71.1% | `##############------` |
| kire | 5,437 | 70.8% | `##############------` |
| kire_components | 4,473 | 58.2% | `############--------` |
| edge.js | 2,929 | 38.1% | `########------------` |
| handlebars | 2,337 | 30.4% | `######--------------` |
| nunjucks | 1,279 | 16.6% | `###-----------------` |
| ejs | 1,103 | 14.4% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 830,350 | **Fastest** | `####################` |
| kire | 801,663 | 96.5% | `###################-` |
| pug | 795,546 | 95.8% | `###################-` |
| kire_components | 653,529 | 78.7% | `################----` |
| edge.js | 225,404 | 27.1% | `#####---------------` |
| handlebars | 191,068 | 23.0% | `#####---------------` |
| nunjucks | 126,181 | 15.2% | `###-----------------` |
| ejs | 102,148 | 12.3% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 99,109 | **Fastest** | `####################` |
| kire_elements | 98,050 | 98.9% | `####################` |
| pug | 88,580 | 89.4% | `##################--` |
| kire_components | 76,766 | 77.5% | `###############-----` |
| edge.js | 29,336 | 29.6% | `######--------------` |
| handlebars | 25,961 | 26.2% | `#####---------------` |
| nunjucks | 14,292 | 14.4% | `###-----------------` |
| ejs | 11,279 | 11.4% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,970 | **Fastest** | `####################` |
| kire | 9,683 | 97.1% | `###################-` |
| pug | 9,197 | 92.2% | `##################--` |
| kire_components | 7,467 | 74.9% | `###############-----` |
| edge.js | 3,086 | 31.0% | `######--------------` |
| handlebars | 2,449 | 24.6% | `#####---------------` |
| nunjucks | 1,459 | 14.6% | `###-----------------` |
| ejs | 1,123 | 11.3% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
