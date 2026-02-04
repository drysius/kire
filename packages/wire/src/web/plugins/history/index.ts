import historyCoordinator from "./coordinator";
import { isObjecty, unwrap } from "./utils";

export default function history(Alpine: any) {
	Alpine.magic("queryString", (el: HTMLElement, { interceptor }: any) => {
		let alias: string | undefined;
		let alwaysShow = false;
		let usePush = false;

		return interceptor(
			(
				initialSeedValue: any,
				getter: Function,
				setter: Function,
				path: string,
				key: string,
			) => {
				const queryKey = alias || path;

				const { initial, replace, push, pop } = track(
					queryKey,
					initialSeedValue,
					alwaysShow,
				);

				setter(initial);

				if (!usePush) {
					Alpine.effect(() => replace(getter()));
				} else {
					Alpine.effect(() => push(getter()));

					pop(async (newValue: any) => {
						setter(newValue);
						await Promise.resolve();
					});
				}

				return initial;
			},
			(func: any) => {
				func.alwaysShow = () => { alwaysShow = true; return func; };
				func.usePush = () => { usePush = true; return func; };
				func.as = (key: string) => { alias = key; return func; };
			},
		);
	});
    
    // Expõe no Alpine estilo Livewire
    Alpine.history = { track };
    
    // Garante que o coordenador use o Alpine para efeitos se necessário
    historyCoordinator.addErrorHandler('alpine', (err: any) => {
        // console.warn('Alpine History Error:', err);
    });
}

export function track(
	name: string,
	initialSeedValue: any,
	alwaysShow = false,
	except: any = null,
) {
	const { has, get, set, remove } = queryStringUtils();

	let url = historyCoordinator.getUrl();
	const isInitiallyPresentInUrl = has(url, name);
	const initialValue = isInitiallyPresentInUrl
		? get(url, name)
		: initialSeedValue;
	const initialValueMemo = JSON.stringify(initialValue);
	const exceptValueMemo = JSON.stringify(except);

	const hasReturnedToInitialValue = (newValue: any) =>
		JSON.stringify(newValue) === initialValueMemo;
	const hasReturnedToExceptValue = (newValue: any) =>
		JSON.stringify(newValue) === exceptValueMemo;

	if (alwaysShow) url = set(url, name, initialValue);

	replace(url, name, { value: initialValue });

	let lock = false;

	const update = (strategy: Function, newValue: any) => {
		if (lock) return;

		let url = historyCoordinator.getUrl();

		if (
			!alwaysShow &&
			!isInitiallyPresentInUrl &&
			hasReturnedToInitialValue(newValue)
		) {
			url = remove(url, name);
		} else if (newValue === undefined) {
			url = remove(url, name);
		} else if (!alwaysShow && hasReturnedToExceptValue(newValue)) {
			url = remove(url, name);
		} else {
			url = set(url, name, newValue);
		}

		strategy(url, name, { value: newValue });
	};

	return {
		initial: initialValue,
		replace(newValue: any) { update(replace, newValue); },
		push(newValue: any) { update(push, newValue); },
		pop(receiver: Function) {
			const handler = (e: PopStateEvent) => {
                const state = e.state || (historyCoordinator as any).state;
				if (!state || !state.alpine) return;

				Object.entries(state.alpine).forEach(
					([iName, { value: newValue }]: any) => {
						if (iName !== name) return;
						lock = true;
						const result = receiver(newValue);
						if (result instanceof Promise) {
							result.finally(() => (lock = false));
						} else {
							lock = false;
						}
					},
				);
			};

			window.addEventListener("popstate", handler);
			return () => window.removeEventListener("popstate", handler);
		},
	};
}

function replace(url: URL, key: string, object: any) {
	historyCoordinator.replaceState(url, { [key]: object });
}

function push(url: URL, key: string, object: any) {
	historyCoordinator.pushState(url, { [key]: object });
}

function queryStringUtils() {
	return {
		has(url: URL, key: string) {
			const search = url.search;
			if (!search) return false;
			const data = fromQueryString(search, key);
			return Object.keys(data).includes(key);
		},
		get(url: URL, key: string) {
			const search = url.search;
			if (!search) return false;
			const data = fromQueryString(search, key);
			return data[key];
		},
		set(url: URL, key: string, value: any) {
			const data = fromQueryString(url.search, key);
			data[key] = stripNulls(unwrap(value));
			url.search = toQueryString(data);
			return url;
		},
		remove(url: URL, key: string) {
			const data = fromQueryString(url.search, key);
			delete data[key];
			url.search = toQueryString(data);
			return url;
		},
	};
}

function stripNulls(value: any) {
	if (!isObjecty(value)) return value;
	for (const key in value) {
		if (value[key] === null) delete value[key];
		else value[key] = stripNulls(value[key]);
	}
	return value;
}

function toQueryString(data: any) {
	const isObjecty = (subject: any) =>
		typeof subject === "object" && subject !== null;

	const buildQueryStringEntries = (
		data: any,
		entries: any = {},
		baseKey = "",
	) => {
		Object.entries(data).forEach(([iKey, iValue]) => {
			const key = baseKey === "" ? iKey : `${baseKey}[${iKey}]`;

			if (iValue === null) {
				entries[key] = "";
			} else if (!isObjecty(iValue)) {
				entries[key] = encodeURIComponent(iValue as string)
					.replaceAll("%20", "+")
					.replaceAll("%2C", ",");
			} else {
				entries = {
					...entries,
					...buildQueryStringEntries(iValue, entries, key),
				};
			}
		});
		return entries;
	};

	const entries = buildQueryStringEntries(data);
	return Object.entries(entries)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");
}

function fromQueryString(search: string, queryKey: string) {
	search = search.replace("?", "");
	if (search === "") return {};

	const insertDotNotatedValueIntoData = (
		key: string,
		value: any,
		data: any,
	) => {
		const [first, second, ...rest] = key.split(".");
		if (!second) return (data[key] = value);
		if (data[first] === undefined) {
			data[first] = isNaN(Number(second)) ? {} : [];
		}
		insertDotNotatedValueIntoData(
			[second, ...rest].join("."),
			value,
			data[first],
		);
	};

	const entries = search.split("&").map((i) => i.split("="));
	const data: any = Object.create(null);

	entries.forEach(([key, value]) => {
		if (typeof value == "undefined") return;
		value = decodeURIComponent(value.replaceAll("+", "%20"));
		const decodedKey = decodeURIComponent(key);
		const shouldBeHandledAsArray =
			decodedKey.includes("[") && decodedKey.startsWith(queryKey);

		if (!shouldBeHandledAsArray) {
			data[key] = value;
		} else {
			const dotNotatedKey = decodedKey.replaceAll("[", ".").replaceAll("]", "");
			insertDotNotatedValueIntoData(dotNotatedKey, value, data);
		}
	});
	return data;
}