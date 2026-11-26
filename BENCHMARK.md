# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:46:16 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 776,997 | **Fastest** | `####################` |
| kire | 763,289 | 98.2% | `####################` |
| pug | 676,676 | 87.1% | `#################---` |
| kire_components | 494,986 | 63.7% | `#############-------` |
| nunjucks | 297,572 | 38.3% | `########------------` |
| edge.js | 259,246 | 33.4% | `#######-------------` |
| handlebars | 205,333 | 26.4% | `#####---------------` |
| ejs | 126,253 | 16.2% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 88,355 | **Fastest** | `####################` |
| kire | 87,229 | 98.7% | `####################` |
| pug | 77,654 | 87.9% | `##################--` |
| kire_components | 55,630 | 63.0% | `#############-------` |
| edge.js | 35,774 | 40.5% | `########------------` |
| nunjucks | 34,606 | 39.2% | `########------------` |
| handlebars | 24,552 | 27.8% | `######--------------` |
| ejs | 14,488 | 16.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,101 | **Fastest** | `####################` |
| kire | 8,794 | 96.6% | `###################-` |
| pug | 7,168 | 78.8% | `################----` |
| kire_components | 5,776 | 63.5% | `#############-------` |
| edge.js | 3,589 | 39.4% | `########------------` |
| nunjucks | 3,562 | 39.1% | `########------------` |
| handlebars | 2,716 | 29.8% | `######--------------` |
| ejs | 1,463 | 16.1% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 674,466 | **Fastest** | `####################` |
| kire | 521,443 | 77.3% | `###############-----` |
| kire_elements | 518,420 | 76.9% | `###############-----` |
| kire_components | 428,394 | 63.5% | `#############-------` |
| edge.js | 220,949 | 32.8% | `#######-------------` |
| handlebars | 193,742 | 28.7% | `######--------------` |
| nunjucks | 111,405 | 16.5% | `###-----------------` |
| ejs | 103,501 | 15.3% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 76,810 | **Fastest** | `####################` |
| kire_elements | 57,338 | 74.6% | `###############-----` |
| kire | 57,319 | 74.6% | `###############-----` |
| kire_components | 45,766 | 59.6% | `############--------` |
| edge.js | 27,420 | 35.7% | `#######-------------` |
| handlebars | 24,902 | 32.4% | `######--------------` |
| nunjucks | 12,481 | 16.2% | `###-----------------` |
| ejs | 10,990 | 14.3% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 7,683 | **Fastest** | `####################` |
| kire_elements | 5,471 | 71.2% | `##############------` |
| kire | 5,443 | 70.8% | `##############------` |
| kire_components | 4,521 | 58.8% | `############--------` |
| edge.js | 2,975 | 38.7% | `########------------` |
| handlebars | 2,368 | 30.8% | `######--------------` |
| nunjucks | 1,257 | 16.4% | `###-----------------` |
| ejs | 1,124 | 14.6% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 847,417 | **Fastest** | `####################` |
| kire_elements | 836,625 | 98.7% | `####################` |
| pug | 812,313 | 95.9% | `###################-` |
| kire_components | 628,281 | 74.1% | `###############-----` |
| edge.js | 222,533 | 26.3% | `#####---------------` |
| handlebars | 195,884 | 23.1% | `#####---------------` |
| nunjucks | 126,697 | 15.0% | `###-----------------` |
| ejs | 99,943 | 11.8% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 98,234 | **Fastest** | `####################` |
| kire | 97,153 | 98.9% | `####################` |
| pug | 90,218 | 91.8% | `##################--` |
| kire_components | 74,646 | 76.0% | `###############-----` |
| edge.js | 29,950 | 30.5% | `######--------------` |
| handlebars | 25,887 | 26.4% | `#####---------------` |
| nunjucks | 13,911 | 14.2% | `###-----------------` |
| ejs | 11,023 | 11.2% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,945 | **Fastest** | `####################` |
| kire | 9,731 | 97.8% | `####################` |
| pug | 9,212 | 92.6% | `###################-` |
| kire_components | 7,669 | 77.1% | `###############-----` |
| edge.js | 3,005 | 30.2% | `######--------------` |
| handlebars | 2,329 | 23.4% | `#####---------------` |
| nunjucks | 1,412 | 14.2% | `###-----------------` |
| ejs | 1,081 | 10.9% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
