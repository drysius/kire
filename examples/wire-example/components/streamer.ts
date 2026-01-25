import { WireComponent } from "@kirejs/wire";

export default class Streamer extends WireComponent {
	async addLog() {
		const time = new Date().toLocaleTimeString();
		this.stream(
			"logs",
			`<pre data-prefix=">"><code>Log at ${time}</code></pre>`,
			false,
			"prepend",
		);
	}

	render() {
		return this.view("components.streamer");
	}
}
