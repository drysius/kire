import { Component, Wire, Variable, WireUpload, Rule } from "../lib/wire";
@Wire({ name: "upload" })
export default class Upload extends Component {
	// Using WireUpload for robust file handling
	@Variable("any")
	public file = new WireUpload();
    @Variable("string")
    public description = "";
	@Variable("string")
	public message = "";

	async save() {
        if (typeof this.description !== "string") this.description = "";

        // Example 1: Using this.rule helper with custom message
        const rules: any = {
            description: this.rule('string|required|min:3', 'A description is required (min 3 characters).'),
        };

        // Example 2: Using Rule object for file validation with custom messages
        rules.file = Rule.file("Please select a file.").min(1, "At least one file is required.").max(1, "Only one file allowed.");

        const isValid = this.validate(rules);

        if (!isValid) {
            this.message = "Validation failed.";
            return;
        }

		if (this.file.file) {
			this.message = `Saved ${this.file.file.name} (${(this.file.file.size / 1024).toFixed(2)} KB)`;
			// Simulate processing
			await new Promise((r) => setTimeout(r, 1000));
            
            // Clear after upload
            this.file = new WireUpload();
            this.description = "";
		} else {
			this.message = "No file selected.";
		}
	}

	render() {
		return this.view("components.upload");
	}
}

