/* eslint-disable @typescript-eslint/no-explicit-any */
import EventEmitter from 'events';

interface CollectionChangeEvent<T> {
    added: T[];
    removed: T[];
}

interface CollectionEmitter extends EventEmitter {
    paused?: boolean;
}

const SymbolEvents: unique symbol = Symbol('events');
const SymbolArray: unique symbol = Symbol('array');

function emitSet(target: Collection, value: unknown, prevValue: unknown): void {
    const emitter = (target as any)[SymbolEvents] as CollectionEmitter;
    if (!emitter.paused) {
        const updates: CollectionChangeEvent<unknown> = { added: [], removed: [] };
        if (prevValue) {
            emitter.emit('remove', prevValue, target);
            updates.removed.push(prevValue);
        }
        if (value) {
            emitter.emit('add', value, target);
            updates.added.push(value);
        }
        emitter.emit('change', updates, target);
    }
}

function emitRemoved(target: Collection, removed: unknown[]): void {
    const emitter = (target as any)[SymbolEvents] as CollectionEmitter;
    if (!emitter.paused) {
        for (const item of removed) {
            emitter.emit('remove', item, target);
        }
        emitter.emit('change', { added: [], removed }, target);
    }
}

function checkType(target: Collection, value: unknown): void {
    const modelClass = (target.constructor as typeof Collection).model;
    if (!modelClass) {
        throw new Error(`Model type not defined for ${target.constructor.name}`);
    }
    if (!(value instanceof (modelClass as any))) {
        const valueType =
            value && (value as any).constructor ? (value as any).constructor.name : typeof value;
        throw new Error(`Attempt to write ${valueType} into ${target.constructor.name}`);
    }
}

const ProxyDef: ProxyHandler<Collection> = {
    set(target: Collection, property: string | symbol, value: unknown): boolean {
        const numProp = parseInt(property as string);
        if (isNaN(numProp)) {
            (target as any)[property] = value;
            return true;
        }
        checkType(target, value);
        const array = (target as any)[SymbolArray] as unknown[];
        const prevValue = array[numProp];
        if (prevValue !== value) {
            array[numProp] = value;
            emitSet(target, value, prevValue);
        }
        return true;
    },

    get(target: Collection, property: string | symbol): unknown {
        if (typeof property !== 'string') {
            return (target as any)[property];
        }
        const numProp = parseInt(property);
        if (isNaN(numProp)) {
            return (target as any)[property];
        }
        return ((target as any)[SymbolArray] as unknown[])[numProp];
    }
};

class Collection {
    static model: unknown;

    declare [SymbolEvents]: CollectionEmitter;
    declare [SymbolArray]: unknown[];

    comparator?: ((a: any, b: any) => number) | null;

    constructor(items?: unknown[]) {
        const emitter: CollectionEmitter = new EventEmitter();
        emitter.setMaxListeners(100);

        const properties: PropertyDescriptorMap = {
            [SymbolEvents]: { value: emitter },
            [SymbolArray]: { value: [] as unknown[] }
        };

        Object.defineProperties(this, properties);

        if (items) {
            this.push(...items);
        }

        return new Proxy(this, ProxyDef);
    }

    get length(): number {
        return this[SymbolArray].length;
    }

    set length(value: number) {
        const array = this[SymbolArray];
        let removed: unknown[] | undefined;
        if (value < array.length) {
            removed = array.slice(value);
        }
        array.length = value;
        if (removed) {
            emitRemoved(this, removed);
        }
    }

    push(...items: unknown[]): void {
        if (items.length) {
            for (const item of items) {
                checkType(this, item);
            }
            this[SymbolEvents].paused = true;
            this[SymbolArray].push(...items);
            this[SymbolEvents].paused = false;
            for (const item of items) {
                this[SymbolEvents].emit('add', item, this);
            }
            this[SymbolEvents].emit('change', { added: items, removed: [] }, this);
        }
    }

    pop(): unknown | undefined {
        this[SymbolEvents].paused = true;
        const item = this[SymbolArray].pop();
        this[SymbolEvents].paused = false;
        if (item) {
            this[SymbolEvents].emit('remove', item, this);
            this[SymbolEvents].emit('change', { added: [], removed: [item] }, this);
        }
        return item;
    }

    shift(): unknown | undefined {
        this[SymbolEvents].paused = true;
        const item = this[SymbolArray].shift();
        this[SymbolEvents].paused = false;
        if (item) {
            this[SymbolEvents].emit('remove', item, this);
            this[SymbolEvents].emit('change', { added: [], removed: [item] }, this);
        }
        return item;
    }

    unshift(...items: unknown[]): void {
        if (items.length) {
            for (const item of items) {
                checkType(this, item);
            }
            this[SymbolEvents].paused = true;
            this[SymbolArray].unshift(...items);
            this[SymbolEvents].paused = false;
            for (const item of items) {
                this[SymbolEvents].emit('add', item, this);
            }
            this[SymbolEvents].emit('change', { added: items, removed: [] }, this);
        }
    }

    splice(start: number, deleteCount?: number, ...items: unknown[]): unknown[] {
        for (const item of items) {
            checkType(this, item);
        }
        this[SymbolEvents].paused = true;
        const removed = this[SymbolArray].splice(start, deleteCount as number, ...items);
        this[SymbolEvents].paused = false;
        for (const item of removed) {
            this[SymbolEvents].emit('remove', item, this);
        }
        for (const item of items) {
            this[SymbolEvents].emit('add', item, this);
        }
        if (removed.length || items.length) {
            this[SymbolEvents].emit('change', { added: items, removed }, this);
        }
        return removed;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(eventName: string, listener: (...args: any[]) => void): void {
        this[SymbolEvents].on(eventName, listener);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once(eventName: string, listener: (...args: any[]) => void): void {
        this[SymbolEvents].once(eventName, listener);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(eventName: string, listener: (...args: any[]) => void): void {
        this[SymbolEvents].off(eventName, listener);
    }

    get(id: string): unknown | undefined {
        return this.find((model: any) => model.id === id);
    }

    remove(idOrModel: string | unknown): void {
        for (let i = 0; i < this.length; i++) {
            while (
                i < this.length &&
                (((this as any)[i] as any).id === idOrModel || (this as any)[i] === idOrModel)
            ) {
                this.splice(i, 1);
            }
        }
    }

    sort(): unknown[] {
        return this[SymbolArray].sort(this.comparator as (a: unknown, b: unknown) => number);
    }

    fill(): never {
        throw new Error('Not implemented');
    }

    copyWithin(): never {
        throw new Error('Not implemented');
    }

    toJSON(): unknown[] {
        return this[SymbolArray].concat();
    }

    // These methods are dynamically defined below via ProxiedArrayMethods
    declare [Symbol.iterator]: () => Iterator<unknown>;
    declare concat: (...items: unknown[]) => unknown[];
    declare entries: () => IterableIterator<[number, unknown]>;
    declare every: (predicate: (item: unknown, index: number) => boolean) => boolean;
    declare filter: (predicate: (item: unknown, index: number) => boolean) => unknown[];
    declare find: (predicate: (item: unknown, index: number) => boolean) => unknown | undefined;
    declare findIndex: (predicate: (item: unknown, index: number) => boolean) => number;
    declare flat: () => unknown[];
    declare flatMap: (callback: (item: unknown, index: number) => unknown) => unknown[];
    declare forEach: (callback: (item: unknown, index: number) => void) => void;
    declare includes: (item: unknown) => boolean;
    declare indexOf: (item: unknown) => number;
    declare join: (separator?: string) => string;
    declare keys: () => IterableIterator<number>;
    declare lastIndexOf: (item: unknown) => number;
    declare map: <U>(callback: (item: unknown, index: number) => U) => U[];
    declare reduce: <U>(callback: (acc: U, item: unknown, index: number) => U, initialValue: U) => U;
    declare reduceRight: <U>(
        callback: (acc: U, item: unknown, index: number) => U,
        initialValue: U
    ) => U;
    declare reverse: () => unknown[];
    declare slice: (start?: number, end?: number) => unknown[];
    declare some: (predicate: (item: unknown, index: number) => boolean) => boolean;
    declare values: () => IterableIterator<unknown>;
}

const ProxiedArrayMethods: (symbol | string)[] = [
    Symbol.iterator,
    'concat',
    'entries',
    'every',
    'filter',
    'find',
    'findIndex',
    'flat',
    'flatMap',
    'forEach',
    'includes',
    'indexOf',
    'join',
    'keys',
    'lastIndexOf',
    'map',
    'reduce',
    'reduceRight',
    'reverse',
    'slice',
    'some',
    'values'
];

for (const method of ProxiedArrayMethods) {
    Object.defineProperty(Collection.prototype, method, {
        value: function proxyMethod(this: Collection, ...args: unknown[]): unknown {
            return ((this as any)[SymbolArray] as any)[method](...args);
        }
    });
}

export { Collection };
export type { CollectionChangeEvent };
