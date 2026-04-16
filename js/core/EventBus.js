/**
 * EventBus - 全局事件总线
 * 实现模块间解耦通信，所有模块通过事件交互而非直接引用
 */
export class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    on(event, callback, context = null) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push({ callback, context });
        return this;
    }

    once(event, callback, context = null) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            callback.apply(context, args);
        };
        wrapper._original = callback;
        return this.on(event, wrapper, context);
    }

    off(event, callback) {
        if (!this._listeners.has(event)) return this;
        if (!callback) {
            this._listeners.delete(event);
            return this;
        }
        const listeners = this._listeners.get(event);
        const filtered = listeners.filter(
            l => l.callback !== callback && l.callback._original !== callback
        );
        if (filtered.length === 0) {
            this._listeners.delete(event);
        } else {
            this._listeners.set(event, filtered);
        }
        return this;
    }

    emit(event, ...args) {
        if (!this._listeners.has(event)) return;
        const listeners = [...this._listeners.get(event)];
        for (const { callback, context } of listeners) {
            try {
                callback.apply(context, args);
            } catch (err) {
                console.error(`[EventBus] Error in "${event}" handler:`, err);
            }
        }
    }

    clear() {
        this._listeners.clear();
    }
}

export const eventBus = new EventBus();
