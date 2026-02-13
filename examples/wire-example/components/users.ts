import { WirePageComponent } from "@kirejs/wire";

// Mock data
let ALL_USERS = Array.from({ length: 50 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
}));

export default class Users extends WirePageComponent {
	public search = "";

	// Sync 'search' and 'page' with URL
	public queryString = ["search", "page"];

	public delete(id: number) {
		ALL_USERS = ALL_USERS.filter(u => u.id !== id);
	}

	get users() {
		const filtered = ALL_USERS.filter((u) =>
			u.name.toLowerCase().includes(this.search.toLowerCase()),
		);
		return this.paginate(filtered);
	}

	async updating(name: string, _value: any) {
		if (name === "search") {
			this.resetPage(); // Reset page when searching
		}
	}

	render() {
		return this.view("components.users");
	}
}
