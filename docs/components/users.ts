import { PageComponent } from "../lib/wire";

// Mock data
let ALL_USERS = Array.from({ length: 50 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
}));

export default class Users extends PageComponent {
	public search = "";
	public page = 1;
	public perPage = 10;

	// Sync 'search' and 'page' with URL
	public queryString = ["search", "page"];

	public delete(id: number) {
		ALL_USERS = ALL_USERS.filter(u => u.id !== id);
	}

	get users() {
		const filtered = ALL_USERS.filter((u) =>
			u.name.toLowerCase().includes(this.search.toLowerCase()),
		);

		const total = filtered.length;
		const lastPage = Math.max(1, Math.ceil(total / this.perPage));
		const currentPage = Math.min(Math.max(1, this.page), lastPage);
		if (currentPage !== this.page) this.page = currentPage;

		const start = (currentPage - 1) * this.perPage;
		const data = filtered.slice(start, start + this.perPage);

		return {
			data,
			total,
			currentPage,
			lastPage,
			hasMore: currentPage < lastPage,
		};
	}

	public nextPage() {
		if (this.users.hasMore) this.page++;
	}

	public previousPage() {
		if (this.page > 1) this.page--;
	}

	public resetPage() {
		this.page = 1;
	}

	async updating(name: string, _value: any) {
		if (name === "search") this.resetPage();
	}

	render() {
		return this.view("components.users");
	}
}

