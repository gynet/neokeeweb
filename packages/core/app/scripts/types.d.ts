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

// lodash/throttle — used by menu views
declare module 'lodash/throttle' {
    function throttle<T extends (...args: any[]) => any>(
        fn: T,
        wait: number,
        options?: { leading?: boolean; trailing?: boolean }
    ): T;
    export default throttle;
}

// lodash/debounce
declare module 'lodash/debounce' {
    function debounce<T extends (...args: any[]) => any>(
        fn: T,
        wait: number,
        options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
    ): T;
    export default debounce;
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

// pikaday — date picker library (used by field-view-date)
declare module 'pikaday' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class Pikaday {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(options: any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        el: any;
        show(): void;
        hide(): void;
        destroy(): void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        adjustPosition: (...args: any[]) => void;
    }
    export default Pikaday;
}

// jsqrcode — pure JS QR code decoder (no types published)
declare module 'jsqrcode' {
    class QrCode {
        constructor(image: HTMLImageElement | HTMLCanvasElement);
        decode(): string;
    }
    export default QrCode;
}

// Handlebars templates loaded via webpack handlebars-loader.
// Each `import tpl from 'templates/...hbs'` yields a compiled
// template function that accepts template data + options and
// returns the rendered HTML string.
declare module '*.hbs' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template: (data?: any, options?: any) => string;
    export default template;
}

// util/ui/tip — now a real TS module (migrated from JS)

// comp/browser/key-handler — TS module; keep ambient broader so views
// that still rely on number|string key codes type-check without fuss.
declare module 'comp/browser/key-handler' {
    const KeyHandler: {
        SHORTCUT_ACTION: number;
        SHORTCUT_OPT: number;
        SHORTCUT_SHIFT: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKey(
            key: number,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: (...args: any[]) => void,
            view: unknown,
            shortcut?: number,
            modal?: unknown,
            noPrevent?: boolean
        ): void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        offKey(key: number, handler: (...args: any[]) => void, view: unknown): void;
        reg(): void;
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

// comp/i18n/date-format — now a real TS module, keep ambient signature broader
declare module 'comp/i18n/date-format' {
    const DateFormat: {
        dtStr(dt: Date | number | null | undefined): string;
        dStr(dt: Date | number | null | undefined): string;
        dtStrFs(dt: Date | number | null | undefined): string;
        months(): string[];
        weekDays(): string[];
        shortWeekDays(): string[];
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

// jQuery global — intentionally loose (legacy code uses many shapes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const $: ((...args: any[]) => any) & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trim(str: any): string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

// Webpack-style synchronous require (used for dynamic .hbs template loading)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: (id: string) => any;

// localStorage extended
interface Storage {
    debugView?: string;
    debugBrowserExtension?: string;
}
