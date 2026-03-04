import { Component } from "@kirejs/wire";

export default class Sender extends Component {
	public text = "Hello World";

	async send() {
		// Emit 'hello' event with the text
		this.emit("hello", this.text);
		this.text = "";
	}

	render() {
		return this.view("components.sender");
	}
}
