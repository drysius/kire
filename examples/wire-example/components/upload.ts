import { WireComponent, WireFile, Rule } from "@kirejs/wire";
import { Type } from "@sinclair/typebox";

export default class Upload extends WireComponent {
    // Using WireFile for robust file handling
    public file = new WireFile();
    public description = "";
    public message = "";

    async save() {
        if (!this.validate({
            description: this.rule('string|required|min:3', 'A description is required (min 3 chars).'),
            file: this.rule('file|min:1,max:1', 'Please select a file.'),
        })) {
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