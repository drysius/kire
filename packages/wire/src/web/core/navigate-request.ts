import { trigger } from "./hooks";

export async function sendNavigateRequest(
	uri: string,
	callback: (html: string, destination: URL, status: number) => void,
	errorCallback: (error: any) => void,
) {
	const controller = new AbortController();
	const options = {
		headers: {
			"X-Kirewire-Navigate": "1",
		},
		signal: controller.signal,
	};

	trigger("navigate.request", {
		uri,
		options,
	});

	try {
		const response = await fetch(uri, options);
		const destination = new URL(response.url);
		const html = await response.text();
		const status = response.status;

		callback(html, destination, status);
	} catch (error) {
		errorCallback(error);
		throw error;
	}
}
