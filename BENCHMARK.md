# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Fri, 27 Nov 2026 05:27:24 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1,189,839 | **Fastest** | `####################` |
| kire | 1,114,898 | 93.7% | `###################-` |
| pug | 997,296 | 83.8% | `#################---` |
| kire_components | 773,088 | 65.0% | `#############-------` |
| nunjucks | 425,844 | 35.8% | `#######-------------` |
| edge.js | 380,032 | 31.9% | `######--------------` |
| handlebars | 292,647 | 24.6% | `#####---------------` |
| ejs | 109,249 | 9.2% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 141,990 | **Fastest** | `####################` |
| kire_elements | 140,437 | 98.9% | `####################` |
| pug | 115,188 | 81.1% | `################----` |
| kire_components | 83,592 | 58.9% | `############--------` |
| edge.js | 55,009 | 38.7% | `########------------` |
| nunjucks | 52,582 | 37.0% | `#######-------------` |
| handlebars | 36,449 | 25.7% | `#####---------------` |
| ejs | 11,436 | 8.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 14,549 | **Fastest** | `####################` |
| kire | 12,460 | 85.6% | `#################---` |
| pug | 10,600 | 72.9% | `###############-----` |
| kire_components | 8,115 | 55.8% | `###########---------` |
| nunjucks | 5,294 | 36.4% | `#######-------------` |
| edge.js | 4,987 | 34.3% | `#######-------------` |
| handlebars | 3,712 | 25.5% | `#####---------------` |
| ejs | 1,152 | 7.9% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 1,106,664 | **Fastest** | `####################` |
| kire_elements | 808,874 | 73.1% | `###############-----` |
| kire | 790,115 | 71.4% | `##############------` |
| kire_components | 666,364 | 60.2% | `############--------` |
| edge.js | 314,980 | 28.5% | `######--------------` |
| handlebars | 302,174 | 27.3% | `#####---------------` |
| nunjucks | 174,268 | 15.7% | `###-----------------` |
| ejs | 159,298 | 14.4% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 122,797 | **Fastest** | `####################` |
| kire | 88,401 | 72.0% | `##############------` |
| kire_elements | 87,329 | 71.1% | `##############------` |
| kire_components | 72,230 | 58.8% | `############--------` |
| edge.js | 42,363 | 34.5% | `#######-------------` |
| handlebars | 41,516 | 33.8% | `#######-------------` |
| nunjucks | 18,888 | 15.4% | `###-----------------` |
| ejs | 16,959 | 13.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 11,868 | **Fastest** | `####################` |
| kire | 8,516 | 71.8% | `##############------` |
| kire_elements | 8,225 | 69.3% | `##############------` |
| kire_components | 6,800 | 57.3% | `###########---------` |
| edge.js | 4,430 | 37.3% | `#######-------------` |
| handlebars | 3,520 | 29.7% | `######--------------` |
| nunjucks | 1,957 | 16.5% | `###-----------------` |
| ejs | 1,701 | 14.3% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1,335,651 | **Fastest** | `####################` |
| pug | 1,285,031 | 96.2% | `###################-` |
| kire | 1,214,028 | 90.9% | `##################--` |
| kire_components | 928,167 | 69.5% | `##############------` |
| edge.js | 338,636 | 25.4% | `#####---------------` |
| handlebars | 305,008 | 22.8% | `#####---------------` |
| nunjucks | 168,094 | 12.6% | `###-----------------` |
| ejs | 155,882 | 11.7% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 165,167 | **Fastest** | `####################` |
| kire | 160,724 | 97.3% | `###################-` |
| pug | 141,379 | 85.6% | `#################---` |
| kire_components | 115,380 | 69.9% | `##############------` |
| edge.js | 45,087 | 27.3% | `#####---------------` |
| handlebars | 40,496 | 24.5% | `#####---------------` |
| nunjucks | 21,580 | 13.1% | `###-----------------` |
| ejs | 16,959 | 10.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 16,724 | **Fastest** | `####################` |
| kire_elements | 15,869 | 94.9% | `###################-` |
| pug | 14,423 | 86.2% | `#################---` |
| kire_components | 11,204 | 67.0% | `#############-------` |
| edge.js | 4,542 | 27.2% | `#####---------------` |
| handlebars | 3,726 | 22.3% | `####----------------` |
| nunjucks | 2,116 | 12.7% | `###-----------------` |
| ejs | 1,733 | 10.4% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
