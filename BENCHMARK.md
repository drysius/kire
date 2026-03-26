# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Mar 2026 20:06:17 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 717,014 | **Fastest** | `####################` |
| kire | 379,850 | 53.0% | `###########---------` |
| pug | 344,400 | 48.0% | `##########----------` |
| kire_components | 217,995 | 30.4% | `######--------------` |
| nunjucks | 160,598 | 22.4% | `####----------------` |
| edge.js | 111,946 | 15.6% | `###-----------------` |
| ejs | 86,566 | 12.1% | `##------------------` |
| handlebars | 73,686 | 10.3% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 91,989 | **Fastest** | `####################` |
| kire | 90,230 | 98.1% | `####################` |
| pug | 31,148 | 33.9% | `#######-------------` |
| kire_components | 30,111 | 32.7% | `#######-------------` |
| nunjucks | 21,948 | 23.9% | `#####---------------` |
| edge.js | 17,505 | 19.0% | `####----------------` |
| handlebars | 8,501 | 9.2% | `##------------------` |
| ejs | 8,458 | 9.2% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11,392 | **Fastest** | `####################` |
| kire_elements | 11,267 | 98.9% | `####################` |
| pug | 3,919 | 34.4% | `#######-------------` |
| kire_components | 3,353 | 29.4% | `######--------------` |
| edge.js | 2,062 | 18.1% | `####----------------` |
| nunjucks | 2,042 | 17.9% | `####----------------` |
| handlebars | 1,006 | 8.8% | `##------------------` |
| ejs | 818 | 7.2% | `#-------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 571,913 | **Fastest** | `####################` |
| kire_elements | 468,598 | 81.9% | `################----` |
| pug | 375,636 | 65.7% | `#############-------` |
| kire_components | 159,800 | 27.9% | `######--------------` |
| edge.js | 115,909 | 20.3% | `####----------------` |
| ejs | 70,220 | 12.3% | `##------------------` |
| nunjucks | 67,663 | 11.8% | `##------------------` |
| handlebars | 63,212 | 11.1% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 64,070 | **Fastest** | `####################` |
| kire | 62,116 | 97.0% | `###################-` |
| pug | 48,999 | 76.5% | `###############-----` |
| kire_components | 23,024 | 35.9% | `#######-------------` |
| edge.js | 14,026 | 21.9% | `####----------------` |
| handlebars | 8,614 | 13.4% | `###-----------------` |
| ejs | 7,573 | 11.8% | `##------------------` |
| nunjucks | 7,227 | 11.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8,445 | **Fastest** | `####################` |
| kire | 8,402 | 99.5% | `####################` |
| pug | 5,680 | 67.3% | `#############-------` |
| kire_components | 3,370 | 39.9% | `########------------` |
| edge.js | 1,348 | 16.0% | `###-----------------` |
| handlebars | 940 | 11.1% | `##------------------` |
| nunjucks | 782 | 9.3% | `##------------------` |
| ejs | 667 | 7.9% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 719,363 | **Fastest** | `####################` |
| pug | 424,037 | 58.9% | `############--------` |
| kire | 416,892 | 58.0% | `############--------` |
| kire_components | 165,583 | 23.0% | `#####---------------` |
| edge.js | 118,318 | 16.4% | `###-----------------` |
| ejs | 73,428 | 10.2% | `##------------------` |
| handlebars | 61,422 | 8.5% | `##------------------` |
| nunjucks | 57,758 | 8.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 78,880 | **Fastest** | `####################` |
| kire_elements | 77,827 | 98.7% | `####################` |
| pug | 55,869 | 70.8% | `##############------` |
| kire_components | 32,776 | 41.6% | `########------------` |
| edge.js | 17,098 | 21.7% | `####----------------` |
| nunjucks | 9,847 | 12.5% | `##------------------` |
| handlebars | 8,856 | 11.2% | `##------------------` |
| ejs | 7,943 | 10.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 10,216 | **Fastest** | `####################` |
| kire_elements | 7,140 | 69.9% | `##############------` |
| pug | 5,738 | 56.2% | `###########---------` |
| kire_components | 4,072 | 39.9% | `########------------` |
| edge.js | 1,644 | 16.1% | `###-----------------` |
| handlebars | 1,012 | 9.9% | `##------------------` |
| nunjucks | 943 | 9.2% | `##------------------` |
| ejs | 837 | 8.2% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
