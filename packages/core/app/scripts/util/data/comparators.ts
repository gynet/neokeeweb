/* eslint-disable @typescript-eslint/no-explicit-any */

const LastChar: string = String.fromCharCode(0xfffd);

const hasCollator: boolean = !!(window.Intl && window.Intl.Collator) && !/Edge/.test(navigator.userAgent); // bugged in Edge: #808
const ciCompare: (x: string, y: string) => number = hasCollator
    ? new Intl.Collator(undefined, { sensitivity: 'base' }).compare
    : (x: string, y: string) => x.toLocaleLowerCase().localeCompare(y.toLocaleLowerCase());

const Comparators = {
    stringComparator(
        field: string,
        asc: boolean
    ): (x: Record<string, any>, y: Record<string, any>) => number {
        if (asc) {
            return function (x: Record<string, any>, y: Record<string, any>): number {
                return ciCompare(x[field] || LastChar, y[field] || LastChar);
            };
        } else {
            return function (x: Record<string, any>, y: Record<string, any>): number {
                return ciCompare(y[field], x[field]);
            };
        }
    },

    rankComparator(): (this: { filter: any }, x: any, y: any) => number {
        return function (this: { filter: any }, x: any, y: any): number {
            return y.getRank(this.filter) - x.getRank(this.filter);
        };
    },

    dateComparator(
        field: string,
        asc: boolean
    ): (x: Record<string, any>, y: Record<string, any>) => number {
        if (asc) {
            return function (x: Record<string, any>, y: Record<string, any>): number {
                return x[field] - y[field];
            };
        } else {
            return function (x: Record<string, any>, y: Record<string, any>): number {
                return y[field] - x[field];
            };
        }
    }
};

export { Comparators };
