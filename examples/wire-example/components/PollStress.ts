import { WireComponent } from '@kirejs/wire';

export class PollStress extends WireComponent {
    public count = 0;
    public lastPoller = '';

    public async mount() {
        this.count = 0;
    }

    public increment(poller: string) {
        this.count++;
        this.lastPoller = poller;
        console.log(`[PollStress] Incremented by ${poller}. Count: ${this.count}`);
    }

    public render() {
        return `
            <div>
                <h1>Stress Test: {{ count }}</h1>
                <p>Last Poller: {{ lastPoller }}</p>

                <!-- Multiple polls with different/same timings -->
                <div wire:poll.100ms="increment('fast1')"></div>
                <div wire:poll.100ms="increment('fast2')"></div>
                
                <div wire:poll.500ms="increment('slow1')"></div>
                <div wire:poll.500ms="increment('slow2')"></div>
            </div>
        `;
    }
}
