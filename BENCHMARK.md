# Kire Performance Benchmarks

This report compares **Kire** with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 09 Mar 2026 10:37:09 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 914.545 | **Fastest** | `####################` |
| kire | 725.895 | 79.4% | `################----` |
| pug | 632.727 | 69.2% | `##############------` |
| nunjucks | 237.596 | 26.0% | `#####---------------` |
| edge.js | 160.342 | 17.5% | `####----------------` |
| ejs | 104.429 | 11.4% | `##------------------` |
| handlebars | 94.863 | 10.4% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 116.667 | **Fastest** | `####################` |
| kire_elements | 113.026 | 96.9% | `###################-` |
| pug | 68.552 | 58.8% | `############--------` |
| nunjucks | 32.010 | 27.4% | `#####---------------` |
| edge.js | 23.488 | 20.1% | `####----------------` |
| handlebars | 11.980 | 10.3% | `##------------------` |
| ejs | 11.074 | 9.5% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 12.309 | **Fastest** | `####################` |
| kire | 12.116 | 98.4% | `####################` |
| pug | 7.388 | 60.0% | `############--------` |
| nunjucks | 3.381 | 27.5% | `#####---------------` |
| edge.js | 2.579 | 21.0% | `####----------------` |
| handlebars | 1.681 | 13.7% | `###-----------------` |
| ejs | 1.145 | 9.3% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 1.064.113 | **Fastest** | `####################` |
| kire | 892.841 | 83.9% | `#################---` |
| pug | 841.368 | 79.1% | `################----` |
| edge.js | 165.992 | 15.6% | `###-----------------` |
| handlebars | 97.460 | 9.2% | `##------------------` |
| ejs | 95.245 | 9.0% | `##------------------` |
| nunjucks | 72.340 | 6.8% | `#-------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 145.998 | **Fastest** | `####################` |
| kire | 126.670 | 86.8% | `#################---` |
| pug | 95.815 | 65.6% | `#############-------` |
| edge.js | 22.657 | 15.5% | `###-----------------` |
| handlebars | 12.900 | 8.8% | `##------------------` |
| ejs | 10.337 | 7.1% | `#-------------------` |
| nunjucks | 7.524 | 5.2% | `#-------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 16.446 | **Fastest** | `####################` |
| kire | 16.013 | 97.4% | `###################-` |
| pug | 9.441 | 57.4% | `###########---------` |
| edge.js | 2.361 | 14.4% | `###-----------------` |
| handlebars | 1.367 | 8.3% | `##------------------` |
| ejs | 1.037 | 6.3% | `#-------------------` |
| nunjucks | 760 | 4.6% | `#-------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
