import { WireComponent } from "@kirejs/wire";

export default class Toast extends WireComponent {
    // This component manages the global toast state on the server if needed,
    // or simply acts as a dispatcher. 
    // Here we'll use it to dispatch random toasts to test the client listener.

    async showSuccess() {
        this.emit('notify', { type: 'success', message: 'Operation successful!' });
    }

    async showError() {
        this.emit('notify', { type: 'error', message: 'Something went wrong.' });
    }

    async showInfo() {
        this.emit('notify', { type: 'info', message: 'Just so you know...' });
    }

    async render() {
        return this.view("components.toast");
    }
}