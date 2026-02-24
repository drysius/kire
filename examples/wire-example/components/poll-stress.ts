import { Component } from "@kirejs/wire";

export default class PollStress extends Component {
	public count = 0;
	public lastPoller = "";

	public increment(poller: string) {
		this.count++;
		this.lastPoller = poller;
	}

	render() {
		return this.view("components.poll-stress");
	}
}

