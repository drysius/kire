# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 05:20:11 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 600,112 | **Fastest** | `####################` |
| kire_elements | 557,299 | 92.9% | `###################-` |
| pug | 504,108 | 84.0% | `#################---` |
| kire_components | 404,931 | 67.5% | `#############-------` |
| nunjucks | 214,874 | 35.8% | `#######-------------` |
| edge.js | 201,019 | 33.5% | `#######-------------` |
| handlebars | 147,350 | 24.6% | `#####---------------` |
| ejs | 106,350 | 17.7% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 69,320 | **Fastest** | `####################` |
| kire | 68,278 | 98.5% | `####################` |
| pug | 58,299 | 84.1% | `#################---` |
| kire_components | 43,900 | 63.3% | `#############-------` |
| edge.js | 29,372 | 42.4% | `########------------` |
| nunjucks | 24,735 | 35.7% | `#######-------------` |
| handlebars | 17,278 | 24.9% | `#####---------------` |
| ejs | 11,078 | 16.0% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 7,183 | **Fastest** | `####################` |
| kire | 7,116 | 99.1% | `####################` |
| pug | 5,952 | 82.9% | `#################---` |
| kire_components | 4,534 | 63.1% | `#############-------` |
| edge.js | 2,589 | 36.0% | `#######-------------` |
| nunjucks | 2,586 | 36.0% | `#######-------------` |
| handlebars | 1,831 | 25.5% | `#####---------------` |
| ejs | 1,160 | 16.1% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 516,863 | **Fastest** | `####################` |
| kire_elements | 385,907 | 74.7% | `###############-----` |
| kire | 384,834 | 74.5% | `###############-----` |
| kire_components | 319,330 | 61.8% | `############--------` |
| edge.js | 159,811 | 30.9% | `######--------------` |
| handlebars | 137,032 | 26.5% | `#####---------------` |
| nunjucks | 79,170 | 15.3% | `###-----------------` |
| ejs | 73,809 | 14.3% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 60,428 | **Fastest** | `####################` |
| kire_elements | 43,717 | 72.3% | `##############------` |
| kire | 43,654 | 72.2% | `##############------` |
| kire_components | 35,616 | 58.9% | `############--------` |
| edge.js | 20,065 | 33.2% | `#######-------------` |
| handlebars | 17,537 | 29.0% | `######--------------` |
| nunjucks | 8,660 | 14.3% | `###-----------------` |
| ejs | 7,925 | 13.1% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 5,487 | **Fastest** | `####################` |
| kire | 4,226 | 77.0% | `###############-----` |
| kire_elements | 4,170 | 76.0% | `###############-----` |
| kire_components | 3,333 | 60.7% | `############--------` |
| edge.js | 2,008 | 36.6% | `#######-------------` |
| handlebars | 1,762 | 32.1% | `######--------------` |
| nunjucks | 861 | 15.7% | `###-----------------` |
| ejs | 809 | 14.7% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 668,536 | **Fastest** | `####################` |
| kire_elements | 650,781 | 97.3% | `###################-` |
| pug | 589,669 | 88.2% | `##################--` |
| kire_components | 487,199 | 72.9% | `###############-----` |
| edge.js | 170,872 | 25.6% | `#####---------------` |
| handlebars | 139,932 | 20.9% | `####----------------` |
| nunjucks | 88,440 | 13.2% | `###-----------------` |
| ejs | 77,166 | 11.5% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 82,282 | **Fastest** | `####################` |
| kire_elements | 81,921 | 99.6% | `####################` |
| pug | 69,111 | 84.0% | `#################---` |
| kire_components | 56,020 | 68.1% | `##############------` |
| edge.js | 21,507 | 26.1% | `#####---------------` |
| handlebars | 17,930 | 21.8% | `####----------------` |
| nunjucks | 10,292 | 12.5% | `###-----------------` |
| ejs | 8,329 | 10.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,856 | **Fastest** | `####################` |
| kire_elements | 7,555 | 96.2% | `###################-` |
| pug | 6,993 | 89.0% | `##################--` |
| kire_components | 5,604 | 71.3% | `##############------` |
| edge.js | 2,209 | 28.1% | `######--------------` |
| handlebars | 1,719 | 21.9% | `####----------------` |
| nunjucks | 1,042 | 13.3% | `###-----------------` |
| ejs | 840 | 10.7% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
