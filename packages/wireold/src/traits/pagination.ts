import type { Component } from "../core/component";

type Constructor<T = {}> = new (...args: any[]) => T;

export function WithPagination<TBase extends Constructor<Component>>(Base: TBase) {
    return class WithPagination extends Base {
        public page = 1;
        public perPage = 10;

        // Automatically include page in query string
        constructor(...args: any[]) {
            super(...args);
            // @ts-expect-error protected property access
            if (!this.queryString) this.queryString = [];
            // @ts-expect-error
            if (!this.queryString.includes('page')) this.queryString.push('page');
        }

        public nextPage() {
            this.page++;
        }

        public previousPage() {
            if (this.page > 1) this.page--;
        }

        public gotoPage(page: number) {
            this.page = page;
        }

        public resetPage() {
            this.page = 1;
        }

        public paginate(items: any[]) {
            const start = (this.page - 1) * this.perPage;
            const end = start + this.perPage;
            
            return {
                data: items.slice(start, end),
                total: items.length,
                currentPage: this.page,
                perPage: this.perPage,
                lastPage: Math.ceil(items.length / this.perPage),
                hasMore: end < items.length,
                from: start + 1,
                to: Math.min(end, items.length)
            };
        }
    };
}
