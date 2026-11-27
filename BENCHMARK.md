# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Fri, 27 Nov 2026 05:33:59 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 812,308 | **Fastest** | `####################` |
| kire_elements | 798,797 | 98.3% | `####################` |
| pug | 743,446 | 91.5% | `##################--` |
| kire_components | 445,865 | 54.9% | `###########---------` |
| nunjucks | 307,569 | 37.9% | `########------------` |
| edge.js | 300,232 | 37.0% | `#######-------------` |
| handlebars | 223,291 | 27.5% | `#####---------------` |
| ejs | 88,582 | 10.9% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 97,089 | **Fastest** | `####################` |
| kire_elements | 95,198 | 98.1% | `####################` |
| pug | 85,158 | 87.7% | `##################--` |
| kire_components | 64,165 | 66.1% | `#############-------` |
| edge.js | 42,253 | 43.5% | `#########-----------` |
| nunjucks | 36,007 | 37.1% | `#######-------------` |
| handlebars | 26,488 | 27.3% | `#####---------------` |
| ejs | 9,751 | 10.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11,098 | **Fastest** | `####################` |
| kire_elements | 9,649 | 86.9% | `#################---` |
| pug | 8,150 | 73.4% | `###############-----` |
| kire_components | 6,681 | 60.2% | `############--------` |
| edge.js | 4,080 | 36.8% | `#######-------------` |
| nunjucks | 3,658 | 33.0% | `#######-------------` |
| handlebars | 2,577 | 23.2% | `#####---------------` |
| ejs | 990 | 8.9% | `##------------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 784,332 | **Fastest** | `####################` |
| kire | 556,195 | 70.9% | `##############------` |
| kire_elements | 532,294 | 67.9% | `##############------` |
| kire_components | 469,128 | 59.8% | `############--------` |
| edge.js | 251,296 | 32.0% | `######--------------` |
| handlebars | 216,429 | 27.6% | `######--------------` |
| nunjucks | 128,228 | 16.3% | `###-----------------` |
| ejs | 122,951 | 15.7% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 88,935 | **Fastest** | `####################` |
| kire_elements | 61,355 | 69.0% | `##############------` |
| kire | 60,056 | 67.5% | `##############------` |
| kire_components | 49,298 | 55.4% | `###########---------` |
| edge.js | 32,874 | 37.0% | `#######-------------` |
| handlebars | 26,348 | 29.6% | `######--------------` |
| nunjucks | 13,614 | 15.3% | `###-----------------` |
| ejs | 12,920 | 14.5% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 8,294 | **Fastest** | `####################` |
| kire_elements | 5,701 | 68.7% | `##############------` |
| kire | 5,292 | 63.8% | `#############-------` |
| kire_components | 4,655 | 56.1% | `###########---------` |
| edge.js | 2,928 | 35.3% | `#######-------------` |
| handlebars | 2,199 | 26.5% | `#####---------------` |
| nunjucks | 1,346 | 16.2% | `###-----------------` |
| ejs | 1,317 | 15.9% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 886,549 | **Fastest** | `####################` |
| kire | 881,708 | 99.5% | `####################` |
| pug | 830,133 | 93.6% | `###################-` |
| kire_components | 646,811 | 73.0% | `###############-----` |
| edge.js | 259,237 | 29.2% | `######--------------` |
| handlebars | 224,869 | 25.4% | `#####---------------` |
| nunjucks | 136,545 | 15.4% | `###-----------------` |
| ejs | 133,314 | 15.0% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 103,023 | **Fastest** | `####################` |
| kire | 101,851 | 98.9% | `####################` |
| pug | 94,586 | 91.8% | `##################--` |
| kire_components | 75,849 | 73.6% | `###############-----` |
| edge.js | 31,721 | 30.8% | `######--------------` |
| handlebars | 27,578 | 26.8% | `#####---------------` |
| nunjucks | 14,999 | 14.6% | `###-----------------` |
| ejs | 13,957 | 13.5% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 9,729 | **Fastest** | `####################` |
| kire | 9,708 | 99.8% | `####################` |
| pug | 8,731 | 89.7% | `##################--` |
| kire_components | 6,909 | 71.0% | `##############------` |
| edge.js | 2,790 | 28.7% | `######--------------` |
| handlebars | 2,338 | 24.0% | `#####---------------` |
| nunjucks | 1,523 | 15.7% | `###-----------------` |
| ejs | 1,443 | 14.8% | `###-----------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
