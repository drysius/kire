import { Component, Wire } from "../lib/wire";
@Wire({ name: "streamer" })
export default class Streamer extends Component {
	async addLog() {
		const time = new Date().toLocaleTimeString();
		this.stream(
			"logs",
			`<pre data-prefix=">"><code>Log at ${time}</code></pre>`,
			"prepend",
		);
	}

	render() {
		return this.view("components.streamer");
	}
}

