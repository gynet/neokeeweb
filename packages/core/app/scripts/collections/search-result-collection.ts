/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection } from 'framework/collection';
import { Model } from 'framework/model';
import { Comparators } from 'util/data/comparators';

type ComparatorFn = ((x: any, y: any) => number) | null;

class SearchResultCollection extends Collection {
    static override model = Model;

    comparators: Record<string, ComparatorFn> = {
        'none': null,
        'title': Comparators.stringComparator('title', true),
        '-title': Comparators.stringComparator('title', false),
        'website': Comparators.stringComparator('url', true),
        '-website': Comparators.stringComparator('url', false),
        'user': Comparators.stringComparator('user', true),
        '-user': Comparators.stringComparator('user', false),
        'created': Comparators.dateComparator('created', true),
        '-created': Comparators.dateComparator('created', false),
        'updated': Comparators.dateComparator('updated', true),
        '-updated': Comparators.dateComparator('updated', false),
        '-attachments': (x: any, y: any): number => {
            return this.attachmentSortVal(x).localeCompare(this.attachmentSortVal(y));
        },
        '-rank': Comparators.rankComparator().bind(this)
    };

    defaultComparator = 'title';

    entryFilter: unknown = null;

    constructor(models?: unknown[], options?: { comparator?: string }) {
        super(models);
        const comparatorName: string = (options?.comparator) || this.defaultComparator;
        this.comparator = this.comparators[comparatorName];
    }

    sortEntries(comparator: string, filter: unknown): void {
        this.entryFilter = filter;
        this.comparator = this.comparators[comparator] || this.comparators[this.defaultComparator];
        this.sort();
    }

    attachmentSortVal(entry: any): string {
        const att = entry.attachments;
        let str: string = att.length ? String.fromCharCode(64 + att.length) : 'Z';
        if (att[0]) {
            str += att[0].title;
        }
        return str;
    }
}

export { SearchResultCollection };
