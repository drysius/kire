import type { Kire } from "kire";
import { Kirewire, type KirewireOptions } from "./kirewire";
import { Component } from "./component";
import { HttpAdapter } from "./adapters/http";
import { SocketAdapter } from "./adapters/socket";
import { FileStore } from "./features/file-store";
import { fileUploadMiddleware } from "./features/file-upload";

export default class KirewirePlugin {
    public wire: Kirewire;

    constructor(options: KirewireOptions) {
        this.wire = new Kirewire(options);
    }

    public install(kire: Kire) {
        (kire as any).wire = this.wire;

        kire.directive({
            name: 'wire:id',
            onCall: (api) => {
                const id = api.getAttribute('id');
                const state = api.getAttribute('state') || '{}';
                const sessionId = api.getArgument(0) || 'default-session'; 
                
                const checksum = this.wire.generateChecksum(state, sessionId);

                api.append(` wire:id="${id}" wire:state='${JSON.stringify(state)}' wire:checksum="${checksum}"`);
            }
        });

        if (this.wire.options.adapter) {
            this.wire.options.adapter.install(this.wire, kire);
        }
    }
}

export { Kirewire, Component, HttpAdapter, SocketAdapter, FileStore, fileUploadMiddleware };
