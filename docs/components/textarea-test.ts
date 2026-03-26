import { Component, Variable, Wire } from "../lib/wire";
@Wire({ name: "textarea-test" })
export default class TextareaTest extends Component {
	@Variable("string")
	public message = "";
	@Variable("string")
	public lastSent = "";

	async submit() {
		this.lastSent = this.message;
		this.message = "";
	}

	render() {
		return this.view("components.textarea-test");
	}
}
