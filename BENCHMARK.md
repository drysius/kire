# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 16 Mar 2026 04:17:59 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 560,595 | **Fastest** | `####################` |
| pug | 421,630 | 75.2% | `###############-----` |
| kire | 379,634 | 67.7% | `##############------` |
| kire_components | 210,052 | 37.5% | `#######-------------` |
| nunjucks | 158,501 | 28.3% | `######--------------` |
| edge.js | 110,580 | 19.7% | `####----------------` |
| ejs | 86,375 | 15.4% | `###-----------------` |
| handlebars | 73,675 | 13.1% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 80,091 | **Fastest** | `####################` |
| kire | 79,638 | 99.4% | `####################` |
| pug | 42,701 | 53.3% | `###########---------` |
| kire_components | 27,005 | 33.7% | `#######-------------` |
| nunjucks | 22,629 | 28.3% | `######--------------` |
| edge.js | 20,296 | 25.3% | `#####---------------` |
| handlebars | 9,350 | 11.7% | `##------------------` |
| ejs | 9,324 | 11.6% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,689 | **Fastest** | `####################` |
| kire_elements | 7,810 | 80.6% | `################----` |
| pug | 4,703 | 48.5% | `##########----------` |
| kire_components | 2,649 | 27.3% | `#####---------------` |
| nunjucks | 2,507 | 25.9% | `#####---------------` |
| edge.js | 2,233 | 23.0% | `#####---------------` |
| handlebars | 920 | 9.5% | `##------------------` |
| ejs | 884 | 9.1% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 555,801 | **Fastest** | `####################` |
| kire_elements | 531,817 | 95.7% | `###################-` |
| pug | 433,274 | 78.0% | `################----` |
| kire_components | 128,399 | 23.1% | `#####---------------` |
| edge.js | 113,848 | 20.5% | `####----------------` |
| nunjucks | 80,431 | 14.5% | `###-----------------` |
| ejs | 71,354 | 12.8% | `###-----------------` |
| handlebars | 66,320 | 11.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 70,756 | **Fastest** | `####################` |
| kire_elements | 69,732 | 98.6% | `####################` |
| pug | 48,889 | 69.1% | `##############------` |
| kire_components | 23,129 | 32.7% | `#######-------------` |
| edge.js | 14,679 | 20.7% | `####----------------` |
| handlebars | 8,633 | 12.2% | `##------------------` |
| nunjucks | 8,260 | 11.7% | `##------------------` |
| ejs | 7,701 | 10.9% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 8,424 | **Fastest** | `####################` |
| kire | 7,129 | 84.6% | `#################---` |
| pug | 5,352 | 63.5% | `#############-------` |
| kire_components | 2,819 | 33.5% | `#######-------------` |
| edge.js | 1,672 | 19.8% | `####----------------` |
| handlebars | 981 | 11.6% | `##------------------` |
| nunjucks | 943 | 11.2% | `##------------------` |
| ejs | 765 | 9.1% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 653,428 | **Fastest** | `####################` |
| pug | 472,938 | 72.4% | `##############------` |
| kire | 397,776 | 60.9% | `############--------` |
| kire_components | 138,572 | 21.2% | `####----------------` |
| edge.js | 125,315 | 19.2% | `####----------------` |
| nunjucks | 82,199 | 12.6% | `###-----------------` |
| ejs | 72,763 | 11.1% | `##------------------` |
| handlebars | 63,640 | 9.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 82,612 | **Fastest** | `####################` |
| kire_elements | 57,606 | 69.7% | `##############------` |
| pug | 47,869 | 57.9% | `############--------` |
| kire_components | 24,817 | 30.0% | `######--------------` |
| edge.js | 16,298 | 19.7% | `####----------------` |
| nunjucks | 9,214 | 11.2% | `##------------------` |
| ejs | 7,882 | 9.5% | `##------------------` |
| handlebars | 6,920 | 8.4% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 10,381 | **Fastest** | `####################` |
| kire_elements | 8,677 | 83.6% | `#################---` |
| pug | 5,724 | 55.1% | `###########---------` |
| kire_components | 3,191 | 30.7% | `######--------------` |
| edge.js | 1,951 | 18.8% | `####----------------` |
| handlebars | 980 | 9.4% | `##------------------` |
| nunjucks | 968 | 9.3% | `##------------------` |
| ejs | 807 | 7.8% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
