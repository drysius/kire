import { directive } from "../core/registry";

directive('navigate', (el, dir, component) => {
    if (el.tagName !== 'A') return;

    el.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = el.getAttribute('href');
        if (!url) return;

        // Dispatch event for progress bars etc
        window.dispatchEvent(new CustomEvent('kirewire:navigate', { detail: { url } }));

        try {
            const res = await fetch(url, {
                headers: { 'X-Kire-Navigate': 'true' }
            });
            const html = await res.text();
            
            // Simple body replacement for now, or use Alpine Morph if available on document.body
            // Assuming Alpine is available globally as we are in a plugin
            if ((window as any).Alpine && (window as any).Alpine.morph) {
                 const parser = new DOMParser();
                 const doc = parser.parseFromString(html, 'text/html');
                 (window as any).Alpine.morph(document.body, doc.body);
                 document.title = doc.title;
                 history.pushState({}, '', url);
            } else {
                document.documentElement.innerHTML = html;
                history.pushState({}, '', url);
            }
        } catch (err) {
            window.location.href = url;
        }
    });
});
