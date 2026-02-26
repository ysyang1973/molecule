export default class EventEmitter {
    private _events = new Map<string, Set<Function>>();

    public count(name: string) {
        return this._events.get(name)?.size ?? 0;
    }

    public emit(name: string, ...args: any[]) {
        const listeners = this._events.get(name);
        if (listeners) {
            for (const listener of listeners) {
                listener(...args);
            }
        }
    }

    public subscribe(name: string, listener: Function) {
        if (!this._events.has(name)) {
            this._events.set(name, new Set());
        }
        this._events.get(name)!.add(listener);
    }

    public unsubscribe(name: string, listener?: Function) {
        if (listener) {
            this._events.get(name)?.delete(listener);
        } else {
            this._events.delete(name);
        }
    }

    public reset() {
        this._events.clear();
    }
}
