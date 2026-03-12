import { Component } from "../lib/wire";

export default class TextareaTest extends Component {
	public message = "";
	public lastSent = "";

	async submit() {
		this.lastSent = this.message;
		this.message = "";
	}

	render() {
		return this.view("components.textarea-test");
	}
}


