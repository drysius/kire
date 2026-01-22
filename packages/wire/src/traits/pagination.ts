import type { WireComponent } from "../component";

type Constructor<T = {}> = new (...args: any[]) => T;

export function WithPagination<TBase extends Constructor<WireComponent>>(Base: TBase) {
    return class extends Base {
        public page = 1;
        public perPage = 10;

        public get paginatedQuery() {
            // This assumes queryString includes 'page'
            return { page: this.page };
        }

        public nextPage() {
            this.page++;
        }

        public previousPage() {
            if (this.page > 1) {
                this.page--;
            }
        }

        public gotoPage(page: number) {
            this.page = page;
        }

        public resetPage() {
            this.page = 1;
        }
        
        // Helper to slice array data
        public paginate(items: any[]) {
            const start = (this.page - 1) * this.perPage;
            const end = start + this.perPage;
            return {
                data: items.slice(start, end),
                total: items.length,
                currentPage: this.page,
                lastPage: Math.ceil(items.length / this.perPage),
                perPage: this.perPage,
                hasMore: end < items.length
            };
        }
    };
}
