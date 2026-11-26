import type { Kire } from "../../kire";

export default (kire: Kire<any>) => {
	// @json(expr) — serialize a value to JSON for safe embedding in a JS context.
	kire.directive({
		name: `json`,
		signature: [`expr:any`],
		children: false,
		description:
			"Outputs a value as a JSON string (e.g. for embedding data into a <script> block).",
		example: `<script>const data = @json(user)</script>`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr") ?? "null";
			api.write(`$kire_response += JSON.stringify(${expr});`);
		},
	});

	// @dump(expr) — render a debug view of a value without stopping rendering.
	kire.directive({
		name: `dump`,
		signature: [`expr:any`],
		children: false,
		description: "Outputs a formatted debug dump of a value as a <pre> block.",
		example: `@dump(user)`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr");
			api.write(
				`$kire_response += '<pre class="kire-dump">' + $escape(JSON.stringify(${expr}, null, 2)) + '</pre>';`,
			);
		},
	});

	// @dd(expr) — dump and die: render the dump and halt the rest of the template.
	kire.directive({
		name: `dd`,
		signature: [`expr:any`],
		children: false,
		description:
			"Dump-and-die: outputs a debug dump of a value and stops rendering the rest of the template.",
		example: `@dd(user)`,
		onCall: (api) => {
			const expr = api.getArgument(0) ?? api.getAttribute("expr");
			api.write(
				`$kire_response += '<pre class="kire-dump">' + $escape(JSON.stringify(${expr}, null, 2)) + '</pre>'; return $kire_response;`,
			);
		},
	});

	// @env('production') / @env(['local','staging']) ... @endenv
	kire.directive({
		name: `env`,
		signature: [`name:string|array`],
		children: true,
		closeBy: [`endenv`, `end`],
		description:
			"Renders the block only when the current environment (`$globals.env`) matches the given name(s).",
		example: `@env("local")\n  <p>Dev only</p>\n@endenv`,
		onCall: (api) => {
			const name = api.getArgument(0) ?? api.getAttribute("name") ?? "''";
			api.write(`if ([].concat(${name}).includes($globals.env)) {`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	// @production ... @endproduction
	kire.directive({
		name: `production`,
		children: true,
		closeBy: [`endproduction`, `end`],
		description:
			"Renders the block only when `$globals.env === 'production'`.",
		example: `@production\n  <script src="/analytics.js"></script>\n@endproduction`,
		onCall: (api) => {
			api.write(`if ($globals.env === 'production') {`);
			api.renderChildren();
			api.write(`}`);
		},
	});

	// @inject(name, "ServiceKey") — bind a service from `$globals.services` to a
	// local variable (Kire has no service container; services live on globals).
	kire.directive({
		name: `inject`,
		signature: [`name:string`, `service:string`],
		declares: [{ fromArg: 0, capture: "name", type: "any" }],
		children: false,
		description:
			"Binds a value from `$globals.services[key]` to a local variable for use in the template.",
		example: `@inject(metrics, "MetricsService")`,
		scope: (args) => {
			const name = (args[0] || "").trim();
			return name ? [name] : [];
		},
		onCall: (api) => {
			const name = (api.getArgument(0) ?? api.getAttribute("name") ?? "").trim();
			const service = api.getArgument(1) ?? api.getAttribute("service");
			if (!name || !service) return;
			api.write(
				`${name} = ($globals.services && $globals.services[${service}]);`,
			);
		},
	});

	// @session("key") ... @endsession — render the block when the session has the
	// key, exposing its value as `$value`. Session data lives on `$globals.session`.
	kire.directive({
		name: `session`,
		signature: [`key:string`],
		declares: [
			{
				name: "$value",
				type: "any",
				description: "The session value exposed inside the @session block.",
			},
		],
		children: true,
		closeBy: [`endsession`, `end`],
		description:
			"Renders the block when `$globals.session[key]` is set and exposes it as `$value`.",
		example: `@session("status")\n  <div class="alert">{{ $value }}</div>\n@endsession`,
		scope: () => [`$value`],
		onCall: (api) => {
			const key = api.getArgument(0) ?? api.getAttribute("key");
			api.write(`if ($globals.session && $globals.session[${key}] != null) {
                $value = $globals.session[${key}];`);
			api.renderChildren();
			api.write(`}`);
		},
	});
};
