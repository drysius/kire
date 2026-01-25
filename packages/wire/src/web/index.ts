import morph from "@alpinejs/morph";
import Alpine from "alpinejs";
import { on, trigger, triggerAsync } from "./core/hooks";
import {
	interceptAction,
	interceptMessage,
	interceptRequest,
} from "./core/interceptor";
import { directive } from "./core/registry";
import { allComponents, findComponent, first, getByName } from "./core/store";
import WiredAlpinePlugin from "./lifecycle";
import navigate from "./plugins/navigate";

//@ts-expect-error ignore
window.Alpine = Alpine;

function dispatch(name: string, params: any) {
	window.dispatchEvent(
		new CustomEvent(name, {
			detail: params,
			bubbles: true,
			composed: true,
			cancelable: true,
		}),
	);
}

function dispatchTo(componentName: string, name: string, params: any) {
	const components = getByName(componentName);
	components.forEach((component) => {
		component.el.dispatchEvent(
			new CustomEvent(name, {
				detail: params,
				bubbles: false,
				composed: true,
				cancelable: true,
			}),
		);
	});
}

function fireAction(component: any, method: string, params: any[] = []) {
	if (typeof component === "string") component = findComponent(component);
	if (!component) throw new Error("Component not found");
	return component.call(method, params);
}

const Kirewire = {
	directive,
	first,
	find: findComponent,
	getByName,
	all: allComponents,
	dispatch,
	dispatchTo,
	fireAction,
	on,
	hook: on,
	trigger,
	triggerAsync,
	interceptAction,
	interceptMessage,
	interceptRequest,
	get navigate() {
		return (Alpine as any).navigate;
	},
	start: () => {
		trigger("kirewire:init");
		Alpine.start();
		window.dispatchEvent(new CustomEvent("kirewire:initialized"));
		trigger("kirewire:initialized");
	},
};

//@ts-expect-error ignore
window.Kirewire = Kirewire;

Alpine.plugin(morph);
Alpine.plugin(navigate);
Alpine.plugin(WiredAlpinePlugin);

document.addEventListener("DOMContentLoaded", () => {
	Kirewire.start();
});
