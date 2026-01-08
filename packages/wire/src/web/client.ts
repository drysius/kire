export const getClientScript = (config: { endpoint: string; csrf?: string }) => `
<script>
    window.__KIREWIRE_CONFIG__ = ${JSON.stringify(config)};
    
    document.addEventListener('DOMContentLoaded', () => {
        const config = window.__KIREWIRE_CONFIG__;
        
        window.KireWire = {
            call: async (id, snapshot, name, method, params) => {
                 try {
                     const headers = {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                     };
                     
                     const res = await fetch(config.endpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ component: name, snapshot, method, params })
                     });
                     
                     if (!res.ok) throw new Error('Network response was not ok');
                     
                     const data = await res.json();
                     
                     if (data.redirect) {
                         window.location.href = data.redirect;
                         return;
                     }

                     if(data.html) {
                         const el = document.querySelector(`[wire\:id="${id}"]`);
                         if(el) { 
                             // Basic DOM Diffing replacement could go here
                             el.innerHTML = data.html; 
                             el.setAttribute('wire:snapshot', data.snapshot); 
                         }
                     }
                     
                     if(data.events) {
                         data.events.forEach(e => window.dispatchEvent(new CustomEvent(e.name, { detail: e.params })));
                     }
                 } catch (error) {
                     console.error('KireWire Error:', error);
                 }
            }
        };

        document.addEventListener('click', e => {
            const el = e.target.closest('[wire\:click]');
            if(!el) return;
            
            const action = el.getAttribute('wire:click');
            const root = el.closest('[wire\:id]');
            
            if(!root) return;
            
            const id = root.getAttribute('wire:id');
            const snap = root.getAttribute('wire:snapshot');
            const name = root.getAttribute('wire:component');
            
            let method = action; 
            let params = [];
            
            // Simple parser for method(param1, param2)
            if(action.includes('(') && action.endsWith(')')) {
                const match = action.match(/^([^(]+)\\(.*)\\) $/);
                if (match) {
                    method = match[1];
                    // Very naive param splitting, fails on commas inside strings
                    params = match[2].split(',').map(s => {
                        s = s.trim();
                        if (s === 'true') return true;
                        if (s === 'false') return false;
                        if (!isNaN(Number(s))) return Number(s);
                        return s.replace(/^['"]|['"]$/g, '');
                    }).filter(s => s !== '');
                }
            }
            
            window.KireWire.call(id, snap, name, method, params);
        });
    });
</script>