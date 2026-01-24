type InterceptorCallback = (ctx: any) => void;

export const actionInterceptors: InterceptorCallback[] = [];
export const messageInterceptors: InterceptorCallback[] = [];
export const requestInterceptors: InterceptorCallback[] = [];

export function interceptAction(callback: InterceptorCallback) {
    actionInterceptors.push(callback);
    return () => {
        const index = actionInterceptors.indexOf(callback);
        if (index > -1) actionInterceptors.splice(index, 1);
    };
}

export function interceptMessage(callback: InterceptorCallback) {
    messageInterceptors.push(callback);
    return () => {
        const index = messageInterceptors.indexOf(callback);
        if (index > -1) messageInterceptors.splice(index, 1);
    };
}

export function interceptRequest(callback: InterceptorCallback) {
    requestInterceptors.push(callback);
    return () => {
        const index = requestInterceptors.indexOf(callback);
        if (index > -1) requestInterceptors.splice(index, 1);
    };
}

export function runInterceptors(interceptors: InterceptorCallback[], ctx: any) {
    interceptors.forEach(cb => cb(ctx));
}
