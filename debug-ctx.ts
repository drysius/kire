
const mockCtx = {
    $props: { name: 'parent' },
    $response: 'parent:',
    $kire: { NullProtoObj: function() {} },
    $fork: function() { 
        const self = this;
        return { 
            ...this, 
            $response: '', 
            $props: { ...this.$props },
            $fork: self.$fork,
            $emptyResponse: self.$emptyResponse
        }; 
    },
    $emptyResponse: function() {
        this.$response = '';
        return this;
    }
};

const mockDeps = {
    _tpl0: {
        execute: function($ctx) {
            $ctx.$response += "child(" + $ctx.$props.name + ")";
        },
        dependencies: {}
    }
};

console.log("--- Testando Sugestão do Usuário (Captura Fora do Bloco) ---");

try {
    const $ctx = mockCtx;
    const $deps = mockDeps;

    (function() {
        const { name } = $ctx.$props;
        
        // Simulação do código gerado
        const $ctx0 = $ctx; // Captura fora do bloco
        {
            const $ctx = $ctx0.$fork().$emptyResponse(); // Nova declaração dentro, usando a captura
            
            Object.assign($ctx.$props, { name: 'child' });
            const id = $deps._tpl0;
            id.execute.call($ctx.$props, $ctx, id.dependencies);
            
            $ctx0.$response += $ctx.$response;
        }
    })();

    console.log("Resultado:", mockCtx.$response);
} catch (e) {
    console.error("ERRO:", e.name + ": " + e.message);
}
