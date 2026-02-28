import { Kirewire } from "../kirewire";

Kirewire.directive('model', ({ el, expression, cleanup, wire }) => {
    if (!(el instanceof HTMLInputElement) || el.type !== 'file') return;

    const handler = async () => {
        const files = el.files;
        if (!files || files.length === 0) return;

        const componentId = wire.getComponentId(el);
        if (!componentId) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]!);
        }

        const xhr = new XMLHttpRequest();
        
        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = {
                    loaded: e.loaded,
                    total: e.total,
                    percent: Math.round((e.loaded / e.total) * 100),
                    status: 'uploading'
                };
                wire.$emit('upload:progress', { componentId, property: expression, ...progress });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const result = JSON.parse(xhr.responseText);
                wire.call(el, '$set', [expression, { ...result, __is_wire_file: true }]);
                wire.$emit('upload:finished', { componentId, property: expression });
            } else {
                wire.$emit('upload:error', { componentId, property: expression, error: xhr.statusText });
            }
        });

        xhr.open('POST', '/_wire/upload');
        xhr.send(formData);
    };

    el.addEventListener('change', handler);
    cleanup(() => el.removeEventListener('change', handler));
});
