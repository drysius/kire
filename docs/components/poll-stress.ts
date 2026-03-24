import { Component, Wire, Variable } from "../lib/wire";
@Wire({ name: "poll-stress" })
export default class PollStress extends Component {
	@Variable("number")
	public count = 0;
	@Variable("string")
	public lastPoller = "";

	public increment(poller: string) {
		this.count++;
		this.lastPoller = poller;
	}

	render() {
		return this.view("components.poll-stress");
	}
}


