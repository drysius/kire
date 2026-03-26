# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Mar 2026 18:41:35 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 735,323 | **Fastest** | `####################` |
| pug | 403,186 | 54.8% | `###########---------` |
| kire | 376,072 | 51.1% | `##########----------` |
| kire_components | 228,544 | 31.1% | `######--------------` |
| nunjucks | 162,432 | 22.1% | `####----------------` |
| edge.js | 133,888 | 18.2% | `####----------------` |
| ejs | 78,331 | 10.7% | `##------------------` |
| handlebars | 74,736 | 10.2% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 98,393 | **Fastest** | `####################` |
| kire | 95,599 | 97.2% | `###################-` |
| pug | 37,916 | 38.5% | `########------------` |
| kire_components | 36,016 | 36.6% | `#######-------------` |
| nunjucks | 23,361 | 23.7% | `#####---------------` |
| edge.js | 19,920 | 20.2% | `####----------------` |
| ejs | 8,945 | 9.1% | `##------------------` |
| handlebars | 8,794 | 8.9% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 11,401 | **Fastest** | `####################` |
| kire | 11,376 | 99.8% | `####################` |
| pug | 5,024 | 44.1% | `#########-----------` |
| kire_components | 3,711 | 32.5% | `#######-------------` |
| nunjucks | 2,521 | 22.1% | `####----------------` |
| edge.js | 2,489 | 21.8% | `####----------------` |
| handlebars | 1,276 | 11.2% | `##------------------` |
| ejs | 944 | 8.3% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 513,076 | **Fastest** | `####################` |
| kire | 491,783 | 95.8% | `###################-` |
| pug | 375,168 | 73.1% | `###############-----` |
| kire_components | 155,187 | 30.2% | `######--------------` |
| edge.js | 110,557 | 21.5% | `####----------------` |
| ejs | 72,804 | 14.2% | `###-----------------` |
| handlebars | 67,802 | 13.2% | `###-----------------` |
| nunjucks | 66,996 | 13.1% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 73,044 | **Fastest** | `####################` |
| kire | 64,913 | 88.9% | `##################--` |
| pug | 50,161 | 68.7% | `##############------` |
| kire_components | 29,847 | 40.9% | `########------------` |
| edge.js | 13,786 | 18.9% | `####----------------` |
| handlebars | 8,507 | 11.6% | `##------------------` |
| nunjucks | 7,807 | 10.7% | `##------------------` |
| ejs | 7,553 | 10.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 8,772 | **Fastest** | `####################` |
| kire_elements | 8,581 | 97.8% | `####################` |
| pug | 5,687 | 64.8% | `#############-------` |
| kire_components | 3,749 | 42.7% | `#########-----------` |
| edge.js | 1,535 | 17.5% | `###-----------------` |
| handlebars | 991 | 11.3% | `##------------------` |
| nunjucks | 826 | 9.4% | `##------------------` |
| ejs | 778 | 8.9% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 575,233 | **Fastest** | `####################` |
| pug | 497,775 | 86.5% | `#################---` |
| kire | 435,317 | 75.7% | `###############-----` |
| kire_components | 166,585 | 29.0% | `######--------------` |
| edge.js | 124,802 | 21.7% | `####----------------` |
| nunjucks | 89,263 | 15.5% | `###-----------------` |
| ejs | 74,940 | 13.0% | `###-----------------` |
| handlebars | 57,114 | 9.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 82,499 | **Fastest** | `####################` |
| kire_elements | 75,599 | 91.6% | `##################--` |
| pug | 36,461 | 44.2% | `#########-----------` |
| kire_components | 28,526 | 34.6% | `#######-------------` |
| edge.js | 15,535 | 18.8% | `####----------------` |
| nunjucks | 9,233 | 11.2% | `##------------------` |
| handlebars | 8,832 | 10.7% | `##------------------` |
| ejs | 7,400 | 9.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,908 | **Fastest** | `####################` |
| kire | 7,162 | 72.3% | `##############------` |
| pug | 6,629 | 66.9% | `#############-------` |
| kire_components | 4,425 | 44.7% | `#########-----------` |
| edge.js | 1,854 | 18.7% | `####----------------` |
| nunjucks | 1,030 | 10.4% | `##------------------` |
| handlebars | 1,001 | 10.1% | `##------------------` |
| ejs | 825 | 8.3% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
