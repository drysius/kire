import { directive } from "../core/registry";

const prefetchCache = new Map<string, Promise<string>>();

directive('navigate', (el, dir, component) => {
    if (el.tagName !== 'A') return;

    const url = el.getAttribute('href');
    if (!url) return;

    const fetchPage = (targetUrl: string): Promise<string> => {
        if (prefetchCache.has(targetUrl)) return prefetchCache.get(targetUrl)!;

        const promise = fetch(targetUrl, {
            headers: { 'X-Kire-Navigate': 'true' }
        }).then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.text();
        });

        prefetchCache.set(targetUrl, promise);
        // Clear cache after 5 minutes to avoid stale data
        setTimeout(() => prefetchCache.delete(targetUrl), 300000); 

        return promise;
    };

    if (dir.modifiers.includes('hover')) {
        el.addEventListener('mouseenter', () => {
            fetchPage(url).catch(() => {}); // prefetch silently
        });
    }

    el.addEventListener('click', async (e) => {
        e.preventDefault();

        // Dispatch event for progress bars etc
        window.dispatchEvent(new CustomEvent('kirewire:navigate', { detail: { url } }));

        try {
            const html = await fetchPage(url);
            
            // Simple body replacement for now, or use Alpine Morph if available on document.body
            // Assuming Alpine is available globally as we are in a plugin
            if ((window as any).Alpine && (window as any).Alpine.morph) {
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(html, 'text/html');
                 
                 // Extract title
                 if (doc.title) document.title = doc.title;
                 
                 // Morph Body
                 (window as any).Alpine.morph(document.body, doc.body);
                 
                 history.pushState({}, '', url);
                 
                 // Re-initialize scripts/components if necessary? 
                 // Alpine MutationObserver should handle new wire:id elements.
            } else {
                document.documentElement.innerHTML = html;
                history.pushState({}, '', url);
            }
        } catch (err) {
            window.location.href = url;
        }
    });
});
