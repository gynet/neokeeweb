/**
 * Type declaration for the Model base class.
 * The actual implementation is in model.js using Proxy-based reactive properties.
 */
export declare class Model {
    constructor(data?: Record<string, unknown>);

    /** Set multiple properties at once. Use { silent: true } to suppress change events. */
    set(props: Record<string, unknown>, options?: { silent?: boolean }): void;

    /** Subscribe to an event */
    on(eventName: string, listener: (...args: unknown[]) => void): void;

    /** Subscribe to an event (fires once then removes) */
    once(eventName: string, listener: (...args: unknown[]) => void): void;

    /** Unsubscribe from an event */
    off(eventName: string, listener: (...args: unknown[]) => void): void;

    /** Emit an event */
    emit(eventName: string, ...args: unknown[]): void;

    /**
     * Define default model properties. These become reactive (Proxy-observed) instance fields.
     * Call on the class after definition: `MyModel.defineModelProperties({ key: defaultValue })`.
     */
    static defineModelProperties(
        properties: Record<string, unknown>,
        options?: { extensions?: boolean }
    ): void;
}
