export const consumeStream = async (stream: any): Promise<string> => {
    if (typeof stream === "string") return stream;
    if (!stream || typeof stream.getReader !== "function") return String(stream);

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += typeof value === "string" ? value : decoder.decode(value);
        }
    } finally {
        reader.releaseLock();
    }
    return result;
};
