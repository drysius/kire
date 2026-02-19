import collapse from '@alpinejs/collapse';
import focus from '@alpinejs/focus';
import persist from '@alpinejs/persist';
import intersect from '@alpinejs/intersect';
import sort from '@alpinejs/sort';
import resize from '@alpinejs/resize';
import anchor from '@alpinejs/anchor';
import mask from '@alpinejs/mask';
import morph from "@alpinejs/morph";
import Alpine from "alpinejs";
import { dispatchGlobal, dispatchTo } from './core/events';
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
import history from "./plugins/history";
import historyCoordinator from "./plugins/history/coordinator";

//@ts-expect-error ignore
window.Alpine = Alpine;

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
	dispatch: dispatchGlobal,
	dispatchTo,
	fireAction,
	on,
	hook: on,
	trigger,
	triggerAsync,
	interceptAction,
	interceptMessage,
	interceptRequest,
    history: historyCoordinator, // Ponto central de histórico
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

// Plugins
Alpine.plugin(collapse);
Alpine.plugin(focus);
Alpine.plugin(persist);
Alpine.plugin(intersect);
Alpine.plugin(sort);
Alpine.plugin(resize);
Alpine.plugin(anchor);
Alpine.plugin(mask);
Alpine.plugin(morph);
Alpine.plugin(history);
Alpine.plugin(navigate);
Alpine.plugin(WiredAlpinePlugin);

document.addEventListener("DOMContentLoaded", () => {
	Kirewire.start();
});
