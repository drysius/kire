# Kire Performance Benchmarks

This report compares **Kire** directives, elements, and components with other popular template engines in various scenarios. Benchmarks are executed in isolated worker processes to ensure fair comparisons. Templates are precompiled once per engine before the timed loop.

Generated on: Thu, 26 Nov 2026 06:21:21 GMT

## Runtime: BUN

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 772,342 | **Fastest** | `####################` |
| kire_elements | 746,147 | 96.6% | `###################-` |
| pug | 686,036 | 88.8% | `##################--` |
| kire_components | 504,264 | 65.3% | `#############-------` |
| nunjucks | 302,957 | 39.2% | `########------------` |
| edge.js | 267,526 | 34.6% | `#######-------------` |
| handlebars | 209,153 | 27.1% | `#####---------------` |
| ejs | 135,170 | 17.5% | `####----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 91,526 | **Fastest** | `####################` |
| kire | 78,467 | 85.7% | `#################---` |
| pug | 76,581 | 83.7% | `#################---` |
| kire_components | 55,069 | 60.2% | `############--------` |
| nunjucks | 35,598 | 38.9% | `########------------` |
| edge.js | 34,800 | 38.0% | `########------------` |
| handlebars | 24,396 | 26.7% | `#####---------------` |
| ejs | 14,422 | 15.8% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,247 | **Fastest** | `####################` |
| kire_elements | 9,081 | 98.2% | `####################` |
| pug | 7,495 | 81.1% | `################----` |
| kire_components | 5,276 | 57.1% | `###########---------` |
| edge.js | 3,611 | 39.1% | `########------------` |
| nunjucks | 3,526 | 38.1% | `########------------` |
| handlebars | 2,556 | 27.6% | `######--------------` |
| ejs | 1,468 | 15.9% | `###-----------------` |

## Runtime: DENO

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 675,777 | **Fastest** | `####################` |
| kire_elements | 522,891 | 77.4% | `###############-----` |
| kire | 510,394 | 75.5% | `###############-----` |
| kire_components | 428,351 | 63.4% | `#############-------` |
| edge.js | 214,952 | 31.8% | `######--------------` |
| handlebars | 191,046 | 28.3% | `######--------------` |
| nunjucks | 116,683 | 17.3% | `###-----------------` |
| ejs | 102,862 | 15.2% | `###-----------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 76,898 | **Fastest** | `####################` |
| kire | 57,128 | 74.3% | `###############-----` |
| kire_elements | 56,755 | 73.8% | `###############-----` |
| kire_components | 46,368 | 60.3% | `############--------` |
| edge.js | 29,244 | 38.0% | `########------------` |
| handlebars | 24,673 | 32.1% | `######--------------` |
| nunjucks | 12,728 | 16.6% | `###-----------------` |
| ejs | 11,250 | 14.6% | `###-----------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| pug | 7,705 | **Fastest** | `####################` |
| kire | 5,450 | 70.7% | `##############------` |
| kire_elements | 5,426 | 70.4% | `##############------` |
| kire_components | 4,506 | 58.5% | `############--------` |
| edge.js | 2,950 | 38.3% | `########------------` |
| handlebars | 2,332 | 30.3% | `######--------------` |
| nunjucks | 1,275 | 16.5% | `###-----------------` |
| ejs | 1,133 | 14.7% | `###-----------------` |

## Runtime: NODE

### Scenario: Small Data (10 items, 10000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 848,761 | **Fastest** | `####################` |
| pug | 807,697 | 95.2% | `###################-` |
| kire_elements | 798,406 | 94.1% | `###################-` |
| kire_components | 653,002 | 76.9% | `###############-----` |
| edge.js | 228,945 | 27.0% | `#####---------------` |
| handlebars | 194,465 | 22.9% | `#####---------------` |
| nunjucks | 128,661 | 15.2% | `###-----------------` |
| ejs | 98,493 | 11.6% | `##------------------` |

### Scenario: Medium Data (100 items, 1000 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire_elements | 99,704 | **Fastest** | `####################` |
| kire | 99,661 | 100.0% | `####################` |
| pug | 87,948 | 88.2% | `##################--` |
| kire_components | 74,957 | 75.2% | `###############-----` |
| edge.js | 30,050 | 30.1% | `######--------------` |
| handlebars | 26,041 | 26.1% | `#####---------------` |
| nunjucks | 14,361 | 14.4% | `###-----------------` |
| ejs | 10,880 | 10.9% | `##------------------` |

### Scenario: Large Data (1000 items, 100 iterations)

| Engine | Ops/sec | Speed | Visual |
| :--- | :--- | :--- | :--- |
| kire | 9,791 | **Fastest** | `####################` |
| kire_elements | 9,708 | 99.2% | `####################` |
| pug | 9,174 | 93.7% | `###################-` |
| kire_components | 7,619 | 77.8% | `################----` |
| edge.js | 2,959 | 30.2% | `######--------------` |
| handlebars | 2,444 | 25.0% | `#####---------------` |
| nunjucks | 1,450 | 14.8% | `###-----------------` |
| ejs | 1,087 | 11.1% | `##------------------` |

---
*Note: Benchmarks performed using automated GitHub Actions in isolated workers. Performance may vary between environments.*
