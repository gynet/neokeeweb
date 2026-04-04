/* eslint-disable @typescript-eslint/no-explicit-any */

interface Searchable {
    isProtected?: boolean;
    length?: number;
    indexOf?(s: any): number;
    indexOfLower?(s: any): number;
    indexOfSelfInLower?(s: any): number;
}

const Ranking = {
    getStringRank(s1: Searchable | string, s2: Searchable | string): number {
        if (!s1 || !s2) {
            return 0;
        }
        let ix = indexOf(s1, s2);
        if (ix === 0 && (s1 as any).length === (s2 as any).length) {
            return 10;
        } else if (ix === 0) {
            return 5;
        } else if (ix > 0) {
            return 3;
        }
        ix = indexOf(s2, s1);
        if (ix === 0) {
            return 5;
        } else if (ix > 0) {
            return 3;
        }
        return 0;
    }
};

function indexOf(target: any, search: any): number {
    if (target.isProtected) {
        return target.indexOfLower(search);
    }
    if (search.isProtected) {
        return search.indexOfSelfInLower(target);
    }
    return target.indexOf(search);
}

(window as any).Ranking = Ranking;

export { Ranking };
