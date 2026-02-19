export function whenThisLinkIsPressed(
	el: HTMLElement,
	callback: (whenReleased: (fn: () => void) => void) => void,
) {
	const isProgrammaticClick = (e: any) => !e.isTrusted;
	const isNotPlainLeftClick = (e: any) =>
		e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
	const isNotPlainEnterKey = (e: any) =>
		e.keyCode !== 13 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

	el.addEventListener("click", (e: any) => {
		if (isProgrammaticClick(e)) {
			e.preventDefault();
			callback((whenReleased) => whenReleased());
			return;
		}
		if (isNotPlainLeftClick(e)) return;

		// console.log('Kirewire Navigate: Preventing default click');
		e.preventDefault();
	});

	el.addEventListener("mousedown", (e: any) => {
		if (isNotPlainLeftClick(e)) return;
		e.preventDefault();
		callback((whenReleased) => {
			const handler = (e: any) => {
				e.preventDefault();
				whenReleased();
				el.removeEventListener("mouseup", handler);
			};
			el.addEventListener("mouseup", handler);
		});
	});

	el.addEventListener("keydown", (e: any) => {
		if (isNotPlainEnterKey(e)) return;
		e.preventDefault();
		callback((whenReleased) => whenReleased());
	});
}

export function whenThisLinkIsHoveredFor(
	el: HTMLElement,
	ms = 60,
	callback: (e: any) => void,
) {
	el.addEventListener("mouseenter", (e) => {
		const timeout = setTimeout(() => {
			callback(e);
		}, ms);

		const handler = () => {
			clearTimeout(timeout);
			el.removeEventListener("mouseleave", handler);
		};

		el.addEventListener("mouseleave", handler);
	});
}

export function extractDestinationFromLink(linkEl: Element) {
	return createUrlObjectFromString(linkEl.getAttribute("href"));
}

export function createUrlObjectFromString(urlString: string | null) {
	return urlString !== null && new URL(urlString, document.baseURI);
}

export function getUriStringFromUrlObject(urlObject: URL) {
	return urlObject.pathname + urlObject.search + urlObject.hash;
}
