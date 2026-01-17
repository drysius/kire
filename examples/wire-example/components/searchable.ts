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
    role: i % 3 === 0 ? 'Admin' : 'User'
}));

export default class Searchable extends WireComponent {
    public search = "";
    public roleFilter = "";

    get filteredUsers() {
        return ALL_USERS.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(this.search.toLowerCase()) || 
                                  user.email.toLowerCase().includes(this.search.toLowerCase());
            const matchesRole = this.roleFilter ? user.role === this.roleFilter : true;
            return matchesSearch && matchesRole;
        });
    }

    render() {
        return `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <div style="margin-bottom: 20px; display: flex; gap: 15px;">
                <div style="flex: 1;">
                    <input 
                        wire:model.live.debounce.300ms="search" 
                        type="text"
                        value="{{ search }}"
                        placeholder="Search users..." 
                        style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
                    />
                </div>
                <select wire:model.live="roleFilter" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                </select>
            </div>

            <div style="position: relative;">
                <!-- Loading Indicator -->
                <div wire:loading style="position: absolute; top: -10px; right: 0; font-size: 0.8em; color: #666;">
                    Searching...
                </div>

                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f9f9f9; text-align: left;">
                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Name</th>
                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Email</th>
                            <th style="padding: 10px; border-bottom: 2px solid #ddd;">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for(user of filteredUsers)
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px;">{{ user.name }}</td>
                                <td style="padding: 10px;">{{ user.email }}</td>
                                <td style="padding: 10px;">
                                    <span style="
                                        background: {{ user.role === 'Admin' ? '#dbeafe' : '#f3f4f6' }};
                                        color: {{ user.role === 'Admin' ? '#1e40af' : '#374151' }};
                                        padding: 2px 8px;
                                        border-radius: 10px;
                                        font-size: 0.85em;
                                    ">
                                        {{ user.role }}
                                    </span>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" style="padding: 20px; text-align: center; color: #888;">
                                    No users found matching "{{ search }}"
                                </td>
                            </tr>
                        @end
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }
}
