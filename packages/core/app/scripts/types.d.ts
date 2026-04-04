/**
 * Global type declarations for @neokeeweb/core.
 * Provides ambient module declarations for JS-only dependencies
 * and global types used across the application.
 */

// npm `events` polyfill (used in browser via webpack)
declare module 'events' {
    class EventEmitter {
        addListener(event: string | symbol, listener: (...args: unknown[]) => void): this;
        on(event: string | symbol, listener: (...args: unknown[]) => void): this;
        once(event: string | symbol, listener: (...args: unknown[]) => void): this;
        off(event: string | symbol, listener: (...args: unknown[]) => void): this;
        removeListener(event: string | symbol, listener: (...args: unknown[]) => void): this;
        removeAllListeners(event?: string | symbol): this;
        setMaxListeners(n: number): this;
        getMaxListeners(): number;
        listeners(event: string | symbol): ((...args: unknown[]) => void)[];
        rawListeners(event: string | symbol): ((...args: unknown[]) => void)[];
        emit(event: string | symbol, ...args: unknown[]): boolean;
        listenerCount(event: string | symbol): number;
        prependListener(event: string | symbol, listener: (...args: unknown[]) => void): this;
        prependOnceListener(event: string | symbol, listener: (...args: unknown[]) => void): this;
        eventNames(): (string | symbol)[];
    }
    export = EventEmitter;
}

// morphdom
declare module 'morphdom' {
    function morphdom(
        fromNode: Node,
        toNode: string | Node,
        options?: Record<string, unknown>
    ): Node;
    export default morphdom;
}

// baron scrollbar library
declare module 'baron' {
    interface BaronInstance {
        update(): void;
        dispose(): void;
    }
    function baron(opts: Record<string, unknown>): BaronInstance;
    export default baron;
}

// util/ui/tip — JS module not yet migrated
declare module 'util/ui/tip' {
    interface TipInstance {
        show(): void;
        hide(): void;
    }
    const Tip: {
        createTips(el: Element): void;
        destroyTips(el: Element): void;
        hideTips(el: Element): void;
        createTip(el: Element, opts: Record<string, unknown>): TipInstance;
    };
    export { Tip };
}

// comp/browser/key-handler — JS module not yet migrated
declare module 'comp/browser/key-handler' {
    const KeyHandler: {
        onKey(
            key: string,
            handler: (...args: unknown[]) => void,
            view: unknown,
            shortcut?: string,
            modal?: string,
            noPrevent?: boolean
        ): void;
        offKey(key: string, handler: (...args: unknown[]) => void, view: unknown): void;
    };
    export { KeyHandler };
}

// comp/app/focus-manager — JS module not yet migrated
declare module 'comp/app/focus-manager' {
    const FocusManager: {
        modal: string | null;
        setModal(modal: string | null): void;
    };
    export { FocusManager };
}

// comp/settings/settings-store — JS module not yet migrated
declare module 'comp/settings/settings-store' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SettingsStore: {
        load(key: string): Promise<any>;
        save(key: string, data: unknown): void;
    };
    export { SettingsStore };
}

// comp/i18n/date-format — JS module not yet migrated
declare module 'comp/i18n/date-format' {
    const DateFormat: {
        dtStr(date: Date): string;
        dStr(date: Date): string;
    };
    export { DateFormat };
}

// Handlebars (aliased as 'hbs' via webpack/tsconfig paths)
declare module 'hbs' {
    const Handlebars: {
        registerHelper(name: string, fn: (...args: any[]) => any): void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    export default Handlebars;
}

// jQuery global
declare const $: (selector: string | Element) => unknown;

// localStorage extended
interface Storage {
    debugView?: string;
}
