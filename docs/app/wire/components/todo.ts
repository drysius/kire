import { Component, LiveComponent, prop } from "@kirejs/wire";

interface Item { id: number; text: string; done: boolean }

@Component("demo-todo")
export class Todo extends LiveComponent {
	@prop items: Item[] = [];
	@prop draft = "";
	private seq = 0;

	add() {
		const text = this.draft.trim();
		if (!text) return;
		this.items.push({ id: ++this.seq + Date.now(), text, done: false });
		this.draft = "";
	}
	toggle(id: number) {
		const it = this.items.find((i) => i.id === id);
		if (it) it.done = !it.done;
	}
	remove(id: number) {
		this.items = this.items.filter((i) => i.id !== id);
	}
	clearDone() {
		this.items = this.items.filter((i) => !i.done);
	}

	render() { return this.view("components.todo"); }
}
