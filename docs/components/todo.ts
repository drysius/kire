import { Component, Variable, Wire } from "../lib/wire";
@Wire({ name: "todo" })
export default class Todo extends Component {
	@Variable("string")
	public task = "";
	@Variable("array")
	public todos: string[] = ["Buy milk", "Walk the dog"];

	get todosWithIndex() {
		return this.todos.map((val, i) => ({ val, i }));
	}

	async add() {
		if (this.validate({ task: (v) => v.length >= 3 || "Min 3 chars" })) {
			this.todos.push(this.task);
			this.task = "";
		}
	}

	async remove(index: number) {
		this.todos.splice(index, 1);
	}

	render() {
		return this.view("components.todo");
	}
}
