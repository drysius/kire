import { WireComponent } from "@kirejs/wire";

export default class Toast extends WireComponent {
    public notifications: Array<{ id: string, message: string, type: string }> = [];
    
    // Listen for 'toast' event
    public listeners = {
        "toast": "add"
    };

    public add(message: string, type = "info") {
        const id = Math.random().toString(36).substr(2, 9);
        this.notifications.push({ id, message, type });
        // In a real app we might want to remove it after timeout, 
        // but server-side timeout implies polling. 
        // For now, we'll let them be dismissible or just stay.
    }

    public remove(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    render() {
        return `
        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;">
            @for(note of notifications)
                <div style="
                    background: {{ note.type === 'error' ? '#fee2e2' : '#e0f2fe' }}; 
                    color: {{ note.type === 'error' ? '#991b1b' : '#075985' }};
                    padding: 12px 16px; 
                    border-radius: 6px; 
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideIn 0.3s ease-out;
                " wire:key="{{ note.id }}">
                    <span>{{ note.message }}</span>
                    <button wire:click="remove('{{ note.id }}')" style="background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.6;">&times;</button>
                </div>
            @end
        </div>
        <style>
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        </style>
        `;
    }
}
