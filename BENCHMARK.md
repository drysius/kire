# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Mar 2026 19:13:41 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 729,504 | **Fastest** | `####################` |
| kire | 378,352 | 51.9% | `##########----------` |
| pug | 325,236 | 44.6% | `#########-----------` |
| kire_components | 227,368 | 31.2% | `######--------------` |
| nunjucks | 144,621 | 19.8% | `####----------------` |
| edge.js | 127,948 | 17.5% | `####----------------` |
| ejs | 77,148 | 10.6% | `##------------------` |
| handlebars | 69,403 | 9.5% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 93,879 | **Fastest** | `####################` |
| kire | 90,442 | 96.3% | `###################-` |
| kire_components | 35,997 | 38.3% | `########------------` |
| pug | 34,189 | 36.4% | `#######-------------` |
| nunjucks | 22,131 | 23.6% | `#####---------------` |
| edge.js | 19,113 | 20.4% | `####----------------` |
| ejs | 8,775 | 9.3% | `##------------------` |
| handlebars | 7,712 | 8.2% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 10,102 | **Fastest** | `####################` |
| kire_elements | 6,714 | 66.5% | `#############-------` |
| pug | 4,964 | 49.1% | `##########----------` |
| kire_components | 2,973 | 29.4% | `######--------------` |
| nunjucks | 2,628 | 26.0% | `#####---------------` |
| edge.js | 2,195 | 21.7% | `####----------------` |
| handlebars | 957 | 9.5% | `##------------------` |
| ejs | 834 | 8.3% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 572,583 | **Fastest** | `####################` |
| kire | 484,484 | 84.6% | `#################---` |
| pug | 398,501 | 69.6% | `##############------` |
| kire_components | 152,151 | 26.6% | `#####---------------` |
| edge.js | 111,652 | 19.5% | `####----------------` |
| nunjucks | 78,234 | 13.7% | `###-----------------` |
| ejs | 71,506 | 12.5% | `##------------------` |
| handlebars | 66,893 | 11.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 72,565 | **Fastest** | `####################` |
| kire | 71,999 | 99.2% | `####################` |
| pug | 47,804 | 65.9% | `#############-------` |
| kire_components | 31,623 | 43.6% | `#########-----------` |
| edge.js | 14,836 | 20.4% | `####----------------` |
| handlebars | 9,244 | 12.7% | `###-----------------` |
| nunjucks | 8,523 | 11.7% | `##------------------` |
| ejs | 6,713 | 9.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 7,988 | **Fastest** | `####################` |
| pug | 5,323 | 66.6% | `#############-------` |
| kire | 4,615 | 57.8% | `############--------` |
| kire_components | 3,908 | 48.9% | `##########----------` |
| edge.js | 1,819 | 22.8% | `#####---------------` |
| ejs | 796 | 10.0% | `##------------------` |
| nunjucks | 693 | 8.7% | `##------------------` |
| handlebars | 603 | 7.5% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 685,853 | **Fastest** | `####################` |
| pug | 471,946 | 68.8% | `##############------` |
| kire | 409,287 | 59.7% | `############--------` |
| kire_components | 164,373 | 24.0% | `#####---------------` |
| edge.js | 120,249 | 17.5% | `####----------------` |
| nunjucks | 89,245 | 13.0% | `###-----------------` |
| ejs | 77,900 | 11.4% | `##------------------` |
| handlebars | 63,696 | 9.3% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 71,462 | **Fastest** | `####################` |
| kire_elements | 66,382 | 92.9% | `###################-` |
| pug | 48,445 | 67.8% | `##############------` |
| kire_components | 33,188 | 46.4% | `#########-----------` |
| edge.js | 15,918 | 22.3% | `####----------------` |
| nunjucks | 9,953 | 13.9% | `###-----------------` |
| handlebars | 9,583 | 13.4% | `###-----------------` |
| ejs | 8,037 | 11.2% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 10,967 | **Fastest** | `####################` |
| kire | 9,120 | 83.2% | `#################---` |
| pug | 6,104 | 55.7% | `###########---------` |
| kire_components | 4,344 | 39.6% | `########------------` |
| edge.js | 1,821 | 16.6% | `###-----------------` |
| handlebars | 1,080 | 9.8% | `##------------------` |
| nunjucks | 1,047 | 9.5% | `##------------------` |
| ejs | 879 | 8.0% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
