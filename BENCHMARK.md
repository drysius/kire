# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Tue, 24 Mar 2026 01:35:49 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 477,859 | **Fastest** | `####################` |
| pug | 414,253 | 86.7% | `#################---` |
| kire | 293,458 | 61.4% | `############--------` |
| kire_components | 200,460 | 41.9% | `########------------` |
| nunjucks | 165,119 | 34.6% | `#######-------------` |
| edge.js | 117,918 | 24.7% | `#####---------------` |
| ejs | 69,507 | 14.5% | `###-----------------` |
| handlebars | 58,470 | 12.2% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 99,962 | **Fastest** | `####################` |
| kire | 92,066 | 92.1% | `##################--` |
| pug | 42,979 | 43.0% | `#########-----------` |
| kire_components | 34,000 | 34.0% | `#######-------------` |
| edge.js | 18,748 | 18.8% | `####----------------` |
| nunjucks | 17,826 | 17.8% | `####----------------` |
| ejs | 9,358 | 9.4% | `##------------------` |
| handlebars | 8,790 | 8.8% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 12,224 | **Fastest** | `####################` |
| kire | 11,070 | 90.6% | `##################--` |
| pug | 4,888 | 40.0% | `########------------` |
| kire_components | 3,757 | 30.7% | `######--------------` |
| nunjucks | 2,456 | 20.1% | `####----------------` |
| edge.js | 2,179 | 17.8% | `####----------------` |
| handlebars | 1,214 | 9.9% | `##------------------` |
| ejs | 951 | 7.8% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 532,634 | **Fastest** | `####################` |
| kire | 490,378 | 92.1% | `##################--` |
| pug | 438,020 | 82.2% | `################----` |
| kire_components | 152,495 | 28.6% | `######--------------` |
| edge.js | 122,365 | 23.0% | `#####---------------` |
| nunjucks | 76,805 | 14.4% | `###-----------------` |
| handlebars | 69,283 | 13.0% | `###-----------------` |
| ejs | 66,891 | 12.6% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 67,856 | **Fastest** | `####################` |
| kire | 63,369 | 93.4% | `###################-` |
| pug | 46,019 | 67.8% | `##############------` |
| kire_components | 29,460 | 43.4% | `#########-----------` |
| edge.js | 10,449 | 15.4% | `###-----------------` |
| ejs | 7,298 | 10.8% | `##------------------` |
| nunjucks | 7,216 | 10.6% | `##------------------` |
| handlebars | 6,753 | 10.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 8,160 | **Fastest** | `####################` |
| kire_elements | 6,350 | 77.8% | `################----` |
| pug | 5,115 | 62.7% | `#############-------` |
| kire_components | 3,367 | 41.3% | `########------------` |
| edge.js | 1,490 | 18.3% | `####----------------` |
| handlebars | 952 | 11.7% | `##------------------` |
| nunjucks | 931 | 11.4% | `##------------------` |
| ejs | 727 | 8.9% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 675,551 | **Fastest** | `####################` |
| pug | 489,169 | 72.4% | `##############------` |
| kire | 381,037 | 56.4% | `###########---------` |
| kire_components | 173,473 | 25.7% | `#####---------------` |
| edge.js | 130,203 | 19.3% | `####----------------` |
| nunjucks | 90,729 | 13.4% | `###-----------------` |
| ejs | 74,176 | 11.0% | `##------------------` |
| handlebars | 71,961 | 10.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 91,856 | **Fastest** | `####################` |
| kire | 90,653 | 98.7% | `####################` |
| pug | 60,361 | 65.7% | `#############-------` |
| kire_components | 34,524 | 37.6% | `########------------` |
| edge.js | 15,049 | 16.4% | `###-----------------` |
| nunjucks | 9,764 | 10.6% | `##------------------` |
| handlebars | 9,431 | 10.3% | `##------------------` |
| ejs | 8,109 | 8.8% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 10,464 | **Fastest** | `####################` |
| kire | 10,288 | 98.3% | `####################` |
| pug | 5,600 | 53.5% | `###########---------` |
| kire_components | 4,099 | 39.2% | `########------------` |
| edge.js | 1,636 | 15.6% | `###-----------------` |
| nunjucks | 1,058 | 10.1% | `##------------------` |
| handlebars | 964 | 9.2% | `##------------------` |
| ejs | 830 | 7.9% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
