import { Component, Variable, Wire } from "../lib/wire";

// Simple in-memory store for demo purposes
const db = {
	messages: [
		{ user: "System", text: "Welcome to the chat!", time: Date.now() },
	] as Array<{
		user: string;
		text: string;
		time: number;
	}>,
};

@Wire({ name: "chat" })
export default class Chat extends Component {
	@Variable("string")
	public input = "";
	@Variable("string")
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
			time: Date.now(),
		});

		this.input = "";

		// Keep only last 50 messages
		if (db.messages.length > 50) db.messages.shift();
	}

	render() {
		return this.view("components.chat");
	}
}
