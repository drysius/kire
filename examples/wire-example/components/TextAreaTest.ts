import { WireComponent } from "@kirejs/wire";

export default class TextAreaTest extends WireComponent {
	public message = "";
    
	async submit() {
        console.log("Submitting:", this.message);
		this.message = "";
	}

	render() {
		return this.view("components.text-area-test");
	}
}
