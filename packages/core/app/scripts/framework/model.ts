/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events';
import { Logger } from 'util/logger';

interface ModelEmitter extends EventEmitter {
    paused?: boolean;
    noChange?: boolean;
}

const SymbolEvents: unique symbol = Symbol('events');
const SymbolDefaults: unique symbol = Symbol('defaults');
const SymbolExtensions: unique symbol = Symbol('extensions');

function emitPropChange(
    target: Model,
    property: string | symbol,
    value: unknown,
    prevValue: unknown
): void {
    const emitter = (target as any)[SymbolEvents] as ModelEmitter;
    if (!emitter.paused) {
        emitter.emit('change:' + String(property), target, value, prevValue);
        if (!emitter.noChange) {
            emitter.emit('change', target, { [property as string]: value });
        }
    }
}

const ProxyDef: ProxyHandler<Model> = {
    deleteProperty(target: Model, property: string | symbol): boolean {
        if (Object.prototype.hasOwnProperty.call(target, property)) {
            const defaults = (target as any)[SymbolDefaults] as Record<string, unknown>;
            const value = defaults[property as string];
            const prevValue = (target as any)[property];
            if (prevValue !== value) {
                if (Object.prototype.hasOwnProperty.call(defaults, property)) {
                    (target as any)[property] = value;
                } else {
                    delete (target as any)[property];
                }
                emitPropChange(target, property, value, prevValue);
            }
            return true;
        }
        return true;
    },
    set(target: Model, property: string | symbol, value: unknown, receiver: unknown): boolean {
        if (
            Object.prototype.hasOwnProperty.call(target, property) ||
            (target as any)[SymbolExtensions]
        ) {
            if ((target as any)[property] !== value) {
                const prevValue = (target as any)[property];
                (target as any)[property] = value;
                emitPropChange(target, property, value, prevValue);
            }
            return true;
        } else {
            new Logger((receiver as any).constructor.name).warn(
                `Unknown property: ${String(property)}`,
                new Error().stack
            );
        }
        return false;
    }
};

class Model {
    declare [SymbolEvents]: ModelEmitter;
    declare [SymbolDefaults]: Record<string, unknown>;
    declare [SymbolExtensions]: boolean;

    constructor(data?: Record<string, unknown>) {
        const emitter: ModelEmitter = new EventEmitter();
        emitter.setMaxListeners(100);

        const properties: PropertyDescriptorMap = {
            [SymbolEvents]: { value: emitter }
        };
        for (const [propName, defaultValue] of Object.entries(
            (this as any)[SymbolDefaults] ?? {}
        )) {
            properties[propName] = {
                configurable: true,
                enumerable: true,
                writable: true,
                value: defaultValue
            };
        }
        Object.defineProperties(this, properties);

        const object = new Proxy(this, ProxyDef);

        if (data) {
            object.set(data, { silent: true });
        }

        return object;
    }

    set(props: Record<string, unknown>, options?: { silent?: boolean }): void {
        const emitter = (this as any)[SymbolEvents] as ModelEmitter;
        const silent = options?.silent;
        if (silent) {
            emitter.paused = true;
        }
        emitter.noChange = true;
        for (const [prop, value] of Object.entries(props)) {
            (this as any)[prop] = value;
        }
        emitter.noChange = false;
        if (silent) {
            emitter.paused = false;
        } else {
            emitter.emit('change', this, props);
        }
    }

    on(eventName: string, listener: (...args: unknown[]) => void): void {
        (this as any)[SymbolEvents].on(eventName, listener);
    }

    once(eventName: string, listener: (...args: unknown[]) => void): void {
        (this as any)[SymbolEvents].once(eventName, listener);
    }

    off(eventName: string, listener: (...args: unknown[]) => void): void {
        (this as any)[SymbolEvents].off(eventName, listener);
    }

    emit(eventName: string, ...args: unknown[]): void {
        (this as any)[SymbolEvents].emit(eventName, ...args);
    }

    static defineModelProperties(
        properties: Record<string, unknown>,
        options?: { extensions?: boolean }
    ): void {
        this.prototype[SymbolDefaults] = { ...this.prototype[SymbolDefaults], ...properties };
        if (options?.extensions) {
            this.prototype[SymbolExtensions] = true;
        }
    }

    static set(properties: Record<string, unknown>): void {
        this.prototype[SymbolDefaults] = properties;
    }
}

export { Model };
