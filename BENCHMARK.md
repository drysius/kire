# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Tue, 15 Sep 2026 19:19:45 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 590,535 | **Fastest** | `####################` |
| kire | 568,819 | 96.3% | `###################-` |
| pug | 532,351 | 90.1% | `##################--` |
| kire_components | 466,860 | 79.1% | `################----` |
| nunjucks | 214,430 | 36.3% | `#######-------------` |
| edge.js | 213,346 | 36.1% | `#######-------------` |
| handlebars | 162,236 | 27.5% | `#####---------------` |
| ejs | 105,793 | 17.9% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 77,471 | **Fastest** | `####################` |
| kire | 77,372 | 99.9% | `####################` |
| pug | 63,041 | 81.4% | `################----` |
| kire_components | 57,272 | 73.9% | `###############-----` |
| edge.js | 29,876 | 38.6% | `########------------` |
| nunjucks | 25,963 | 33.5% | `#######-------------` |
| handlebars | 19,190 | 24.8% | `#####---------------` |
| ejs | 11,448 | 14.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,600 | **Fastest** | `####################` |
| kire_elements | 7,052 | 92.8% | `###################-` |
| pug | 5,841 | 76.9% | `###############-----` |
| kire_components | 5,234 | 68.9% | `##############------` |
| edge.js | 3,023 | 39.8% | `########------------` |
| nunjucks | 2,570 | 33.8% | `#######-------------` |
| handlebars | 2,001 | 26.3% | `#####---------------` |
| ejs | 1,141 | 15.0% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 523,642 | **Fastest** | `####################` |
| kire_elements | 394,216 | 75.3% | `###############-----` |
| kire | 392,556 | 75.0% | `###############-----` |
| kire_components | 343,482 | 65.6% | `#############-------` |
| edge.js | 160,455 | 30.6% | `######--------------` |
| handlebars | 138,401 | 26.4% | `#####---------------` |
| nunjucks | 79,857 | 15.3% | `###-----------------` |
| ejs | 70,427 | 13.4% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 61,469 | **Fastest** | `####################` |
| kire_elements | 43,817 | 71.3% | `##############------` |
| kire | 43,791 | 71.2% | `##############------` |
| kire_components | 37,869 | 61.6% | `############--------` |
| edge.js | 20,120 | 32.7% | `#######-------------` |
| handlebars | 17,509 | 28.5% | `######--------------` |
| nunjucks | 8,843 | 14.4% | `###-----------------` |
| ejs | 7,856 | 12.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 5,884 | **Fastest** | `####################` |
| kire_elements | 4,264 | 72.5% | `##############------` |
| kire | 4,236 | 72.0% | `##############------` |
| kire_components | 3,642 | 61.9% | `############--------` |
| edge.js | 2,123 | 36.1% | `#######-------------` |
| handlebars | 1,680 | 28.6% | `######--------------` |
| nunjucks | 873 | 14.8% | `###-----------------` |
| ejs | 785 | 13.3% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 651,848 | **Fastest** | `####################` |
| kire | 647,312 | 99.3% | `####################` |
| pug | 606,948 | 93.1% | `###################-` |
| kire_components | 577,293 | 88.6% | `##################--` |
| edge.js | 174,127 | 26.7% | `#####---------------` |
| handlebars | 145,277 | 22.3% | `####----------------` |
| nunjucks | 96,027 | 14.7% | `###-----------------` |
| ejs | 78,437 | 12.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 82,269 | **Fastest** | `####################` |
| kire_elements | 78,447 | 95.4% | `###################-` |
| pug | 68,512 | 83.3% | `#################---` |
| kire_components | 67,819 | 82.4% | `################----` |
| edge.js | 20,733 | 25.2% | `#####---------------` |
| handlebars | 17,657 | 21.5% | `####----------------` |
| nunjucks | 10,306 | 12.5% | `###-----------------` |
| ejs | 8,323 | 10.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 8,261 | **Fastest** | `####################` |
| kire_elements | 7,866 | 95.2% | `###################-` |
| kire_components | 6,602 | 79.9% | `################----` |
| pug | 6,393 | 77.4% | `###############-----` |
| edge.js | 2,217 | 26.8% | `#####---------------` |
| handlebars | 1,801 | 21.8% | `####----------------` |
| nunjucks | 1,052 | 12.7% | `###-----------------` |
| ejs | 840 | 10.2% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
