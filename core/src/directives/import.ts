import type { Kire } from "../kire";

export default (kire: Kire<any>) => {
	kire.directive({
		name: `include`,
		signature: [`path:string`, `locals:object`],
		children: false,
		isDependency: (args) => {
			const rawPath = args[0];
			if (typeof rawPath === "string") {
				return [rawPath.replace(/['"]/g, "")];
			}
			return [];
		},
		onCall: (api) => {
			const rawPath = api.getArgument(0) || api.getAttribute("path");
			const locals =
				api.getArgument(1) ||
				api.getAttribute("locals") ||
				"new this.NullProtoObj()";

			if (!rawPath) return;

			const depId = api.depend(rawPath);
			const dep = api.getDependency(rawPath);

			api.write(`{
                const _oldProps = $props;
                $props = Object.assign(Object.create($globals), _oldProps, ${locals});
                const _dep = ${depId};
                const res = _dep.call(this, $props, $globals, _dep); 
                ${dep.meta.async ? `$kire_response += await res;` : `$kire_response += res;`}
                $props = _oldProps;
            }`);
		},
	});
};
