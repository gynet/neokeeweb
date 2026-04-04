// Stub: plugin system — disabled in initial web build
const PluginManager = {
    plugins: [],
    init() {
        return Promise.resolve();
    },
    runAutoUpdate() {},
    install() {
        return Promise.resolve();
    },
    installIfNew() {
        return Promise.resolve();
    },
    uninstall() {
        return Promise.resolve();
    },
    update() {
        return Promise.resolve();
    },
    activate() {},
    disable() {},
    setAutoUpdate() {}
};
export { PluginManager };
