import { registerWireHandler } from "../core/directives";

registerWireHandler("broadcast", (_el, { modifiers, expression }, { component }) => {
    if (!component || typeof component.connectShared !== "function") return;

    if (modifiers.includes("password")) {
        if (typeof component.setSharedPassword === "function") {
            component.setSharedPassword(String(expression || "").trim());
        }
        if (component.shared?.channel) {
            queueMicrotask(() => component.connectShared({
                channel: component.shared.channel,
                password: component.shared?.password
            }));
        }
        return;
    }

    const channel = String(expression || "global").trim() || "global";
    queueMicrotask(() => component.connectShared({
        channel,
        password: component.shared?.password
    }));
});
