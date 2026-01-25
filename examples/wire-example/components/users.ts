import { WirePageComponent } from "@kirejs/wire";

// Mock data
const ALL_USERS = Array.from({ length: 50 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
}));

export default class Users extends WirePageComponent {
	public search = "";

	// Sync 'search' and 'page' with URL
	public queryString = ["search", "page"];

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
