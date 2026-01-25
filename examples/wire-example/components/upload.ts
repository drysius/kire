import { WireComponent } from "@kirejs/wire";

interface UploadedFile {
	name: string;
	size: number;
	type: string;
	content: string; // Base64
}

export default class Upload extends WireComponent {
	public file: UploadedFile | null = null;
	public multipleFiles: UploadedFile[] = [];
	public message = "";

	async save() {
		if (this.file) {
			this.message = `Saved ${this.file.name} (${(this.file.size / 1024).toFixed(2)} KB)`;
			// Simulate processing
			await new Promise((r) => setTimeout(r, 500));
			this.file = null;
		} else if (this.multipleFiles.length > 0) {
			this.message = `Saved ${this.multipleFiles.length} files.`;
			await new Promise((r) => setTimeout(r, 800));
			this.multipleFiles = [];
		} else {
			this.message = "No file selected.";
		}
	}

	render() {
		return this.view("components.upload");
	}
}
