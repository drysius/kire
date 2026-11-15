# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Sun, 15 Nov 2026 02:56:22 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 592,190 | **Fastest** | `####################` |
| kire_elements | 544,363 | 91.9% | `##################--` |
| pug | 493,166 | 83.3% | `#################---` |
| kire_components | 445,348 | 75.2% | `###############-----` |
| edge.js | 210,368 | 35.5% | `#######-------------` |
| nunjucks | 205,645 | 34.7% | `#######-------------` |
| handlebars | 149,026 | 25.2% | `#####---------------` |
| ejs | 105,524 | 17.8% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 70,977 | **Fastest** | `####################` |
| kire_elements | 67,747 | 95.4% | `###################-` |
| pug | 59,260 | 83.5% | `#################---` |
| kire_components | 51,851 | 73.1% | `###############-----` |
| edge.js | 28,048 | 39.5% | `########------------` |
| nunjucks | 25,241 | 35.6% | `#######-------------` |
| handlebars | 16,956 | 23.9% | `#####---------------` |
| ejs | 11,686 | 16.5% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 6,763 | **Fastest** | `####################` |
| kire_elements | 6,576 | 97.2% | `###################-` |
| pug | 5,932 | 87.7% | `##################--` |
| kire_components | 5,380 | 79.6% | `################----` |
| edge.js | 2,859 | 42.3% | `########------------` |
| nunjucks | 2,514 | 37.2% | `#######-------------` |
| handlebars | 1,868 | 27.6% | `######--------------` |
| ejs | 1,143 | 16.9% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 520,385 | **Fastest** | `####################` |
| kire | 385,060 | 74.0% | `###############-----` |
| kire_elements | 384,163 | 73.8% | `###############-----` |
| kire_components | 322,685 | 62.0% | `############--------` |
| edge.js | 159,127 | 30.6% | `######--------------` |
| handlebars | 134,021 | 25.8% | `#####---------------` |
| nunjucks | 79,096 | 15.2% | `###-----------------` |
| ejs | 76,065 | 14.6% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 60,342 | **Fastest** | `####################` |
| kire_elements | 43,630 | 72.3% | `##############------` |
| kire | 43,282 | 71.7% | `##############------` |
| kire_components | 36,604 | 60.7% | `############--------` |
| edge.js | 20,053 | 33.2% | `#######-------------` |
| handlebars | 17,053 | 28.3% | `######--------------` |
| nunjucks | 8,681 | 14.4% | `###-----------------` |
| ejs | 8,031 | 13.3% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 6,052 | **Fastest** | `####################` |
| kire | 4,229 | 69.9% | `##############------` |
| kire_elements | 4,204 | 69.5% | `##############------` |
| kire_components | 3,572 | 59.0% | `############--------` |
| edge.js | 2,007 | 33.2% | `#######-------------` |
| handlebars | 1,686 | 27.9% | `######--------------` |
| nunjucks | 874 | 14.4% | `###-----------------` |
| ejs | 792 | 13.1% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 650,415 | **Fastest** | `####################` |
| kire | 644,304 | 99.1% | `####################` |
| pug | 602,268 | 92.6% | `###################-` |
| kire_components | 577,297 | 88.8% | `##################--` |
| edge.js | 169,495 | 26.1% | `#####---------------` |
| handlebars | 139,984 | 21.5% | `####----------------` |
| nunjucks | 94,162 | 14.5% | `###-----------------` |
| ejs | 78,991 | 12.1% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 80,382 | **Fastest** | `####################` |
| kire | 77,815 | 96.8% | `###################-` |
| pug | 67,064 | 83.4% | `#################---` |
| kire_components | 64,180 | 79.8% | `################----` |
| edge.js | 22,192 | 27.6% | `######--------------` |
| handlebars | 17,409 | 21.7% | `####----------------` |
| nunjucks | 10,382 | 12.9% | `###-----------------` |
| ejs | 8,316 | 10.3% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 8,110 | **Fastest** | `####################` |
| kire_elements | 7,837 | 96.6% | `###################-` |
| pug | 6,847 | 84.4% | `#################---` |
| kire_components | 6,316 | 77.9% | `################----` |
| edge.js | 2,204 | 27.2% | `#####---------------` |
| handlebars | 1,735 | 21.4% | `####----------------` |
| nunjucks | 1,039 | 12.8% | `###-----------------` |
| ejs | 809 | 10.0% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
