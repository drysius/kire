export function parseParams(action: string): { method: string, params: any[] } {
    let method = action;
    let params: any[] = [];
    
    if (action.includes('(')) {
        const parts = action.split('(');
        method = parts[0];
        const argsContent = parts[1].slice(0, -1);
        if (argsContent.trim()) {
             // Basic CSV parser that respects quotes
             const regex = /(".*?"|'.*?'|[^",\s]+)(?=\s*,|\s*$)/g;
             let match;
             while ((match = regex.exec(argsContent)) !== null) {
                let val = match[0];
                 if ((val.startsWith("'") && val.endsWith("'")) || 
                    (val.startsWith('"') && val.endsWith('"'))) {
                    params.push(val.slice(1, -1));
                } else if (val === 'true') {
                    params.push(true);
                } else if (val === 'false') {
                    params.push(false);
                } else if (val === 'null') {
                    params.push(null);
                } else {
                    params.push(isNaN(Number(val)) ? val : Number(val));
                }
             }
        }
    }
    return { method, params };
}

export function getCsrfToken(): string | null {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
}
