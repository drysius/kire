import { WireComponent } from "@kirejs/wire";

interface User {
	id: number;
	name: string;
	email: string;
	role: string;
}

// Mock Data
const ALL_USERS: User[] = Array.from({ length: 50 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
	email: `user${i + 1}@example.com`,
	role: i % 3 === 0 ? "Admin" : "User",
}));

export default class Searchable extends WireComponent {
	public search = "";
	public roleFilter = "";

	get filteredUsers() {
		return ALL_USERS.filter((user) => {
			const matchesSearch =
				user.name.toLowerCase().includes(this.search.toLowerCase()) ||
				user.email.toLowerCase().includes(this.search.toLowerCase());
			const matchesRole = this.roleFilter
				? user.role === this.roleFilter
				: true;
			return matchesSearch && matchesRole;
		});
	}

	render() {
		return this.view("components.searchable");
	}
}
