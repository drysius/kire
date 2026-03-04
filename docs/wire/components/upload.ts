import { Component, WireFile, Rule } from "@kirejs/wire";

export default class Upload extends Component {
	// Using WireFile for robust file handling
	public file = new WireFile();
    public description = "";
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
            this.file = new WireFile();
            this.description = "";
		} else {
			this.message = "No file selected.";
		}
	}

	render() {
		return this.view("components.upload");
	}
}
