import { Component, Variable, Wire } from "../lib/wire";
@Wire({ name: "form" })
export default class RegisterForm extends Component {
	@Variable("string")
	public name = "";
	@Variable("string")
	public email = "";
	@Variable("string")
	public password = "";
	@Variable("string")
	public successMessage = "";

	async register() {
		this.clearErrors();
		await new Promise((i) => setTimeout(i, 5000));

		this.successMessage = "";
		if (!this.name) this.addError("name", "Name is required");
		if (!this.email) this.addError("email", "Email is required");
		if (!this.password) this.addError("password", "Password is required");

		if (Object.keys(this.__errors).length === 0) {
			// Simulate saving
			this.successMessage = `User ${this.name} registered successfully!`;
			this.name = "";
			this.email = "";
			this.password = "";
		}
	}

	async render() {
		return this.view("components.form");
	}
}
