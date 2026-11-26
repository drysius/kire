# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 06:33:45 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 597,442 | **Fastest** | `####################` |
| kire | 586,947 | 98.2% | `####################` |
| pug | 543,388 | 91.0% | `##################--` |
| kire_components | 392,014 | 65.6% | `#############-------` |
| edge.js | 212,705 | 35.6% | `#######-------------` |
| nunjucks | 212,399 | 35.6% | `#######-------------` |
| handlebars | 153,704 | 25.7% | `#####---------------` |
| ejs | 107,082 | 17.9% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 72,502 | **Fastest** | `####################` |
| kire_elements | 69,761 | 96.2% | `###################-` |
| pug | 59,662 | 82.3% | `################----` |
| kire_components | 44,626 | 61.6% | `############--------` |
| edge.js | 29,059 | 40.1% | `########------------` |
| nunjucks | 25,119 | 34.6% | `#######-------------` |
| handlebars | 17,547 | 24.2% | `#####---------------` |
| ejs | 11,671 | 16.1% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 7,029 | **Fastest** | `####################` |
| kire_elements | 6,939 | 98.7% | `####################` |
| pug | 6,007 | 85.5% | `#################---` |
| kire_components | 4,514 | 64.2% | `#############-------` |
| edge.js | 2,800 | 39.8% | `########------------` |
| nunjucks | 2,434 | 34.6% | `#######-------------` |
| handlebars | 1,866 | 26.5% | `#####---------------` |
| ejs | 1,184 | 16.8% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 530,138 | **Fastest** | `####################` |
| kire | 389,198 | 73.4% | `###############-----` |
| kire_elements | 387,676 | 73.1% | `###############-----` |
| kire_components | 315,388 | 59.5% | `############--------` |
| edge.js | 158,013 | 29.8% | `######--------------` |
| handlebars | 135,910 | 25.6% | `#####---------------` |
| nunjucks | 79,363 | 15.0% | `###-----------------` |
| ejs | 76,072 | 14.3% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 60,273 | **Fastest** | `####################` |
| kire | 44,001 | 73.0% | `###############-----` |
| kire_elements | 42,575 | 70.6% | `##############------` |
| kire_components | 34,830 | 57.8% | `############--------` |
| edge.js | 19,913 | 33.0% | `#######-------------` |
| handlebars | 16,341 | 27.1% | `#####---------------` |
| nunjucks | 8,483 | 14.1% | `###-----------------` |
| ejs | 8,081 | 13.4% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 6,039 | **Fastest** | `####################` |
| kire_elements | 4,141 | 68.6% | `##############------` |
| kire | 4,104 | 68.0% | `##############------` |
| kire_components | 3,425 | 56.7% | `###########---------` |
| edge.js | 2,032 | 33.6% | `#######-------------` |
| handlebars | 1,731 | 28.7% | `######--------------` |
| nunjucks | 873 | 14.5% | `###-----------------` |
| ejs | 818 | 13.5% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 688,623 | **Fastest** | `####################` |
| kire_elements | 668,434 | 97.1% | `###################-` |
| pug | 608,837 | 88.4% | `##################--` |
| kire_components | 476,373 | 69.2% | `##############------` |
| edge.js | 173,646 | 25.2% | `#####---------------` |
| handlebars | 140,635 | 20.4% | `####----------------` |
| nunjucks | 94,052 | 13.7% | `###-----------------` |
| ejs | 78,928 | 11.5% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 82,387 | **Fastest** | `####################` |
| kire_elements | 82,017 | 99.6% | `####################` |
| pug | 68,300 | 82.9% | `#################---` |
| kire_components | 55,706 | 67.6% | `##############------` |
| edge.js | 21,906 | 26.6% | `#####---------------` |
| handlebars | 17,730 | 21.5% | `####----------------` |
| nunjucks | 10,338 | 12.5% | `###-----------------` |
| ejs | 8,291 | 10.1% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 8,305 | **Fastest** | `####################` |
| kire_elements | 8,044 | 96.9% | `###################-` |
| pug | 6,719 | 80.9% | `################----` |
| kire_components | 5,575 | 67.1% | `#############-------` |
| edge.js | 2,260 | 27.2% | `#####---------------` |
| handlebars | 1,773 | 21.3% | `####----------------` |
| nunjucks | 1,051 | 12.7% | `###-----------------` |
| ejs | 851 | 10.2% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
