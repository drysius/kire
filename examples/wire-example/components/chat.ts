import { WireComponent } from "@kirejs/wire";

// Simple in-memory store for demo purposes
const db = {
    messages: [
        { user: "System", text: "Welcome to the chat!" }
    ] as Array<{ user: string, text: string, time: number }>
};

export default class Chat extends WireComponent {
    public input = "";
    public username = "Guest";
    
    // Poll every 1s to get new messages
    // Note: wire:poll usage needs to be in the template
    
    get messages() {
        return db.messages;
    }

    public sendMessage() {
        if (!this.input.trim()) return;
        
        db.messages.push({
            user: this.username,
            text: this.input,
            time: Date.now()
        });
        
        this.input = "";
        
        // Keep only last 50 messages
        if (db.messages.length > 50) db.messages.shift();
    }

    render() {
        return `
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;" wire:poll.1000ms>
            <div style="background: #f8fafc; padding: 15px; border-bottom: 1px solid #ddd;">
                <h3 style="margin: 0;">Chat Room</h3>
                <div style="margin-top: 5px;">
                    <label style="font-size: 0.9em;">Username:</label>
                    <input wire:model="username" type="text" style="border: 1px solid #ccc; padding: 4px; border-radius: 4px;" />
                </div>
            </div>
            
            <div style="height: 300px; overflow-y: auto; padding: 15px; background: #fff; display: flex; flex-direction: column; gap: 8px;">
                @for(msg of messages)
                    <div wire:key="{{ msg.time }}" style="align-self: {{ msg.user === username ? 'flex-end' : 'flex-start' }}; max-width: 80%;">
                        <div style="font-size: 0.75em; color: #666; margin-bottom: 2px; text-align: {{ msg.user === username ? 'right' : 'left' }};">
                            {{ msg.user }}
                        </div>
                        <div style="
                            background: {{ msg.user === username ? '#3b82f6' : '#e2e8f0' }};
                            color: {{ msg.user === username ? 'white' : '#1e293b' }};
                            padding: 8px 12px;
                            border-radius: 12px;
                            border-{{ msg.user === username ? 'bottom-right' : 'bottom-left' }}-radius: 2px;
                        ">
                            {{ msg.text }}
                        </div>
                    </div>
                @end
                @if(messages.length === 0)
                    <p style="text-align: center; color: #999;">No messages yet.</p>
                @end
            </div>

            <div style="padding: 15px; background: #f8fafc; border-top: 1px solid #ddd; display: flex; gap: 10px;">
                <input 
                    wire:model="input" 
                    wire:keydown.enter="sendMessage"
                    type="text" 
                    placeholder="Type a message..." 
                    style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;"
                />
                <button 
                    wire:click="sendMessage"
                    style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;"
                >
                    Send
                </button>
            </div>
        </div>
        `;
    }
}
