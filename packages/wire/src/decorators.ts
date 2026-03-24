import { Kind, type TSchema } from "@sinclair/typebox";
import {
	defineWireComponent,
	defineWireVariable,
	type WireVariableInput,
	type WireVariableShapeRules,
} from "./metadata";

type WireDecoratorInput =
	| string
	| {
			name?: string;
			live?: boolean;
			page?: boolean;
	  };

function applyWireDefinition(
	target: Function,
	input: WireDecoratorInput | undefined,
) {
	defineWireComponent(target, input);
}

function registerVariable(
	target: Function | undefined | null,
	propertyName: string,
	input: WireVariableInput,
) {
	if (!target || typeof target !== "function") return;
	const key = String(propertyName || "").trim();
	if (!key) return;
	defineWireVariable(target, key, input);
}

function isTypeBoxSchema(value: unknown): value is TSchema {
	return (
		!!value &&
		typeof value === "object" &&
		Kind in (value as Record<string, unknown>)
	);
}

function normalizeShapeRules(
	input?: WireVariableShapeRules | Array<WireVariableShapeRules>,
): WireVariableShapeRules | undefined {
	if (!input) return undefined;
	const merged: WireVariableShapeRules = {};
	const list = Array.isArray(input) ? input : [input];

	for (let i = 0; i < list.length; i++) {
		const chunk = list[i];
		if (!chunk || typeof chunk !== "object") continue;
		const entries = Object.entries(chunk);
		for (let j = 0; j < entries.length; j++) {
			const [path, rawRule] = entries[j]!;
			const key = String(path || "").trim();
			const rule = String(rawRule || "").trim();
			if (!key || !rule) continue;
			merged[key] = rule;
		}
	}

	return Object.keys(merged).length > 0 ? merged : undefined;
}

export function Wire(input?: WireDecoratorInput) {
	return function (...args: any[]) {
		// Legacy decorators: @Wire()(class Target {})
		if (args.length === 1 && typeof args[0] === "function") {
			applyWireDefinition(args[0], input);
			return args[0];
		}

		// Standard decorators: @Wire()(class Target {})
		if (
			args.length >= 2 &&
			typeof args[0] === "function" &&
			args[1] &&
			typeof args[1] === "object" &&
			args[1].kind === "class"
		) {
			const value = args[0] as Function;
			applyWireDefinition(value, input);
			return value;
		}
	};
}

export function Variable(
	rules: string | TSchema = "any",
	shape?:
		| WireVariableShapeRules
		| Array<WireVariableShapeRules>
		| undefined,
) {
	const variableInput: WireVariableInput = isTypeBoxSchema(rules)
		? {
				rules: "any",
				schema: rules,
				shapeRules: normalizeShapeRules(shape),
			}
		: {
				rules: String(rules || "").trim() || "any",
				shapeRules: normalizeShapeRules(shape),
			};

	return function (...args: any[]) {
		// Legacy decorators: @Variable() prop
		if (
			args.length >= 2 &&
			typeof args[1] === "string" &&
			args[0] &&
			typeof args[0] === "object"
		) {
			const proto = args[0] as Record<string, any>;
			registerVariable(proto.constructor, args[1], variableInput);
			return;
		}

		// Standard decorators: @Variable() prop
		if (
			args.length >= 2 &&
			args[1] &&
			typeof args[1] === "object" &&
			args[1].kind === "field"
		) {
			const context = args[1];
			const name = String(context.name || "").trim();
			context.addInitializer(function (this: any) {
				registerVariable((this as any)?.constructor, name, variableInput);
			});
			return args[0];
		}
	};
}
