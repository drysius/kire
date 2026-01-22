import { WireComponent, WithPagination } from "@kirejs/wire";

// Mock data
const ALL_USERS = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));

// Manual Mixin application because TS decorators are experimental
class BaseUsers extends WireComponent {}
const PaginatedUsers = WithPagination(BaseUsers);

export default class Users extends PaginatedUsers {
    public search = "";
    
    // Sync 'search' and 'page' with URL
    public queryString = ['search', 'page'];

    get users() {
        const filtered = ALL_USERS.filter(u => u.name.toLowerCase().includes(this.search.toLowerCase()));
        return this.paginate(filtered);
    }

    async updating(name: string, value: any) {
        if (name === 'search') {
            this.resetPage(); // Reset page when searching
        }
    }

    render() {
        return this.view('components.users');
    }
}
