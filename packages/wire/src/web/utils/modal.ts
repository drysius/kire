
export function showHtmlModal(html: string) {
    let page = document.createElement('html');
    page.innerHTML = html;
    page.querySelectorAll('a').forEach(a =>
        a.setAttribute('target', '_top')
    );

    let modal = document.getElementById('kirewire-error');

    if (modal) {
        modal.innerHTML = '';
    } else {
        modal = document.createElement('div');
        modal.id = 'kirewire-error';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.padding = '50px';
        modal.style.boxSizing = 'border-box';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        modal.style.zIndex = '99999';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
    }

    let iframeContainer = document.createElement('div');
    iframeContainer.style.backgroundColor = '#18181b'; // Zinc-900
    iframeContainer.style.borderRadius = '8px';
    iframeContainer.style.width = '100%';
    iframeContainer.style.height = '100%';
    iframeContainer.style.maxWidth = '1400px';
    iframeContainer.style.maxHeight = '900px';
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
    iframeContainer.style.border = '1px solid #27272a';

    let iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    iframeContainer.appendChild(iframe);
    modal.appendChild(iframeContainer);

    document.body.prepend(modal);
    document.body.style.overflow = 'hidden';

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(page.outerHTML);
        doc.close();
    }

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideHtmlModal();
    });

    // Close on Escape
    const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') hideHtmlModal();
    };
    window.addEventListener('keydown', onKeydown);
    (modal as any)._cleanup = () => window.removeEventListener('keydown', onKeydown);
}

export function hideHtmlModal() {
    const modal = document.getElementById('kirewire-error');
    if (modal) {
        if ((modal as any)._cleanup) (modal as any)._cleanup();
        modal.outerHTML = '';
        document.body.style.overflow = 'visible';
    }
}
