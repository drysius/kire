import type { WireComponent } from "../component";

type Constructor<T = {}> = new (...args: any[]) => T;

export function WithPagination<TBase extends Constructor<WireComponent>>(
	Base: TBase,
) {
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

		// Helper to slice array data or handle existing pagination
		public paginate(items: any[] | { data: any[]; total: number }) {
			let data: any[] = [];
			let total = 0;

			if (Array.isArray(items)) {
				total = items.length;
				const start = (this.page - 1) * this.perPage;
				const end = start + this.perPage;
				data = items.slice(start, end);
			} else {
				data = items.data;
				total = items.total;
			}

			const lastPage = Math.ceil(total / this.perPage);
			const startItem = (this.page - 1) * this.perPage + 1;
			const endItem = Math.min(this.page * this.perPage, total);

			return {
				data,
				total,
				currentPage: this.page,
				lastPage,
				perPage: this.perPage,
				hasMore: this.page < lastPage,
				from: total > 0 ? startItem : 0,
				to: total > 0 ? endItem : 0,
			};
		}
	};
}
