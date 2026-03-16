function hasNodeBuffer(): boolean {
	return typeof Buffer !== "undefined" && typeof Buffer.from === "function";
}

export function encodeBase64(text: string): string {
	if (hasNodeBuffer()) {
		return Buffer.from(text, "utf-8").toString("base64");
	}

	if (typeof btoa === "function") {
		const bytes = new TextEncoder().encode(text);
		let binary = "";
		for (const byte of bytes) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	}

	throw new Error("No base64 encoder available in this runtime.");
}

export function decodeBase64(base64: string): string {
	if (hasNodeBuffer()) {
		return Buffer.from(base64, "base64").toString("utf-8");
	}

	if (typeof atob === "function") {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return new TextDecoder().decode(bytes);
	}

	throw new Error("No base64 decoder available in this runtime.");
}
