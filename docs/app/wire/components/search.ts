import { Component, LiveComponent, prop } from "@kirejs/wire";

const FRUITS = ["Apple", "Apricot", "Banana", "Blackberry", "Blueberry", "Cherry", "Cranberry", "Grape", "Kiwi", "Lemon", "Lime", "Mango", "Orange", "Papaya", "Peach", "Pear", "Pineapple", "Plum", "Raspberry", "Strawberry"];

@Component("demo-search")
export class Search extends LiveComponent {
	@prop query = "";

	get results() {
		const q = this.query.trim().toLowerCase();
		return q ? FRUITS.filter((f) => f.toLowerCase().includes(q)) : FRUITS;
	}

	render() {
		return this.view("components.search", { results: this.results });
	}
}
