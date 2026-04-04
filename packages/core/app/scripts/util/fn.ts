// 'hbs' is a webpack alias for 'handlebars/runtime'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — webpack alias, not a real module path
import Handlebars from 'hbs';

/**
 * Replacements for methods that are bloated in lodash, as well as other useful helpers.
 * Lodash contains some very well written functions like throttle and debounce.
 * However we don't want to load extra 20kb of code for simple pick, shuffle, or escape.
 */

const escape: (str: string) => string = Handlebars.escapeExpression;

export { escape };

export function noop(): void {}

export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function pick<T extends Record<string, unknown>>(
    obj: T | null | undefined,
    props: string[]
): Partial<T> | null | undefined {
    if (!obj) {
        return obj;
    }
    const result: Partial<T> = {};
    for (const prop of props) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            (result as Record<string, unknown>)[prop] = obj[prop as keyof T];
        }
    }
    return result;
}

export function omit<T extends Record<string, unknown>>(
    obj: T | null | undefined,
    props: string[]
): Partial<T> | null | undefined {
    if (!obj) {
        return obj;
    }
    const result = { ...obj };
    for (const prop of props) {
        delete result[prop as keyof T];
    }
    return result;
}

export function omitEmpty<T extends Record<string, unknown>>(
    obj: T | null | undefined
): Partial<T> | null | undefined {
    if (!obj) {
        return obj;
    }
    return Object.entries(obj).reduce<Record<string, unknown>>((result, [key, value]) => {
        if (value) {
            result[key] = value;
        }
        return result;
    }, {}) as Partial<T>;
}

export function mapObject<T, U>(
    obj: Record<string, T>,
    fn: (value: T) => U
): Record<string, U> {
    return Object.entries(obj).reduce<Record<string, U>>((result, [key, value]) => {
        result[key] = fn(value);
        return result;
    }, {});
}

export function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
        return true;
    }
    if (a instanceof Date) {
        return +a === +(b as Date);
    }
    if (a instanceof Array && b instanceof Array) {
        return a.join(',') === b.join(',');
    }
    return false;
}

export function minmax(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}
