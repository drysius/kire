# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Mon, 29 Jun 2026 19:14:14 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 574.541 | **Fastest** | `####################` |
| kire_elements | 551.204 | 95.9% | `###################-` |
| pug | 515.820 | 89.8% | `##################--` |
| kire_components | 407.166 | 70.9% | `##############------` |
| nunjucks | 209.052 | 36.4% | `#######-------------` |
| edge.js | 174.502 | 30.4% | `######--------------` |
| handlebars | 120.392 | 21.0% | `####----------------` |
| ejs | 92.748 | 16.1% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 70.551 | **Fastest** | `####################` |
| kire | 68.318 | 96.8% | `###################-` |
| pug | 60.642 | 86.0% | `#################---` |
| kire_components | 53.910 | 76.4% | `###############-----` |
| nunjucks | 25.151 | 35.6% | `#######-------------` |
| edge.js | 24.811 | 35.2% | `#######-------------` |
| handlebars | 15.204 | 21.6% | `####----------------` |
| ejs | 8.746 | 12.4% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 8.007 | **Fastest** | `####################` |
| kire_elements | 7.880 | 98.4% | `####################` |
| pug | 6.131 | 76.6% | `###############-----` |
| kire_components | 6.015 | 75.1% | `###############-----` |
| edge.js | 2.822 | 35.2% | `#######-------------` |
| nunjucks | 2.731 | 34.1% | `#######-------------` |
| handlebars | 1.627 | 20.3% | `####----------------` |
| ejs | 989 | 12.4% | `##------------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 821.625 | **Fastest** | `####################` |
| kire | 819.128 | 99.7% | `####################` |
| pug | 768.527 | 93.5% | `###################-` |
| kire_components | 719.259 | 87.5% | `##################--` |
| edge.js | 223.849 | 27.2% | `#####---------------` |
| nunjucks | 122.340 | 14.9% | `###-----------------` |
| ejs | 100.527 | 12.2% | `##------------------` |
| handlebars | 98.488 | 12.0% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 110.294 | **Fastest** | `####################` |
| kire | 110.063 | 99.8% | `####################` |
| pug | 87.271 | 79.1% | `################----` |
| kire_components | 86.796 | 78.7% | `################----` |
| edge.js | 27.974 | 25.4% | `#####---------------` |
| nunjucks | 13.498 | 12.2% | `##------------------` |
| handlebars | 13.129 | 11.9% | `##------------------` |
| ejs | 11.065 | 10.0% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 11.331 | **Fastest** | `####################` |
| kire_elements | 11.276 | 99.5% | `####################` |
| kire_components | 8.828 | 77.9% | `################----` |
| pug | 8.811 | 77.8% | `################----` |
| edge.js | 3.005 | 26.5% | `#####---------------` |
| handlebars | 1.349 | 11.9% | `##------------------` |
| nunjucks | 1.323 | 11.7% | `##------------------` |
| ejs | 1.015 | 9.0% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
