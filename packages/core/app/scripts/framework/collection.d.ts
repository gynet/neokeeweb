/**
 * Type declaration for the Collection base class.
 * The actual implementation uses Proxy-based reactive arrays.
 */
export declare class Collection<T = unknown> {
    constructor(items?: T[]);

    readonly length: number;
    push(...items: T[]): void;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): void;
    splice(start: number, deleteCount?: number, ...items: T[]): T[];

    on(eventName: string, listener: (...args: unknown[]) => void): void;
    once(eventName: string, listener: (...args: unknown[]) => void): void;
    off(eventName: string, listener: (...args: unknown[]) => void): void;

    get(id: string): T | undefined;
    remove(idOrModel: string | T): void;
    sort(): T[];
    toJSON(): T[];

    // Array-like methods
    [index: number]: T;
    [Symbol.iterator](): Iterator<T>;
    concat(...items: (T | T[])[]): T[];
    every(predicate: (item: T, index: number) => boolean): boolean;
    filter(predicate: (item: T, index: number) => boolean): T[];
    find(predicate: (item: T, index: number) => boolean): T | undefined;
    findIndex(predicate: (item: T, index: number) => boolean): number;
    forEach(callback: (item: T, index: number) => void): void;
    includes(item: T): boolean;
    indexOf(item: T): number;
    map<U>(callback: (item: T, index: number) => U): U[];
    reduce<U>(callback: (acc: U, item: T, index: number) => U, initialValue: U): U;
    slice(start?: number, end?: number): T[];
    some(predicate: (item: T, index: number) => boolean): boolean;

    static model: unknown;
}
