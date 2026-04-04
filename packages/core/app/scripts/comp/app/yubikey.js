// Stub: YubiKey support removed in web-only fork
const YubiKey = {
    checkCapability() {
        return Promise.resolve(false);
    },
    challengeResponse() {
        return Promise.reject(new Error('YubiKey not supported in web app'));
    }
};
export { YubiKey };
