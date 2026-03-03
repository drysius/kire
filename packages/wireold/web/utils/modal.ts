/**
 * Error Modal Utility for Wire.
 * Displays technical details in development and a simple message in production.
 */

export function showErrorModal(error: any, context: { status?: number, method?: string, component?: string } = {}) {
    const isProduction = (window as any).__WIRE_CONFIG__?.production === true;
    
    // Remove existing modal if any
    const existing = document.getElementById('wire-error-modal');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'wire-error-modal';
    Object.assign(backdrop.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: '999999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#09090b',
        color: '#fff',
        borderRadius: '12px',
        border: '1px solid #27272a',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: isProduction ? '400px' : '800px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    });

    if (isProduction) {
        // Simple Production UI
        modal.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <div style="color: #ef4444; margin-bottom: 1rem;">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">Action Failed</h3>
                <p style="color: #a1a1aa; font-size: 0.875rem;">We were unable to perform this action. Please try again later.</p>
                <button onclick="document.getElementById('wire-error-modal').remove()" style="margin-top: 1.5rem; background: #27272a; color: #fff; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
            </div>
        `;
    } else {
        // Detailed Development UI (Kire Style)
        const errorMessage = error.message || error.toString();
        const status = context.status || 'Unknown';
        
        modal.innerHTML = `
            <div style="padding: 1.5rem; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="color: #ef4444; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Error ${status}</span>
                    <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0.25rem 0;">${errorMessage}</h3>
                </div>
                <button onclick="document.getElementById('wire-error-modal').remove()" style="background: none; border: none; color: #71717a; cursor: pointer; font-size: 1.5rem;">&times;</button>
            </div>
            <div style="padding: 1.5rem; overflow-y: auto;">
                <div style="margin-bottom: 1.5rem;">
                    <span style="font-size: 0.75rem; font-weight: 600; color: #71717a; text-transform: uppercase;">Context</span>
                    <div style="background: #18181b; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; font-family: monospace; font-size: 0.875rem; color: #38bdf8;">
                        <div>Component: ${context.component || 'N/A'}</div>
                        <div>Method: ${context.method || 'N/A'}</div>
                    </div>
                </div>
                ${error.stack ? `
                <div>
                    <span style="font-size: 0.75rem; font-weight: 600; color: #71717a; text-transform: uppercase;">Stack Trace</span>
                    <pre style="background: #18181b; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; font-family: monospace; font-size: 0.75rem; color: #a1a1aa; overflow-x: auto; white-space: pre-wrap;">${error.stack}</pre>
                </div>
                ` : ''}
            </div>
            <div style="padding: 1rem; background: #18181b; border-top: 1px solid #27272a; text-align: right; font-size: 0.75rem; color: #52525b;">
                Wire Debug Mode &bull; Click outside or ESC to close
            </div>
        `;
    }

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.remove();
    });

    // Close on Escape
    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            backdrop.remove();
            window.removeEventListener('keydown', onKeydown);
        }
    };
    window.addEventListener('keydown', onKeydown);
}
