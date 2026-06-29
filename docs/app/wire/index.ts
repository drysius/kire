import { Kirewire } from "@kirejs/wire";
import { Counter } from "./components/counter";
import { Todo } from "./components/todo";
import { Search } from "./components/search";

/** The docs' Kirewire instance, used for the live playground demos. */
export const wire = new Kirewire({
	secret: process.env.WIRE_SECRET ?? "kire-docs-dev-secret-change-me",
});

wire.component(Counter);
wire.component(Todo);
wire.component(Search);
