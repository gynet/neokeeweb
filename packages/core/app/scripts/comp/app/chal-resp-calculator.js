// Stub: YubiKey challenge-response removed in web-only fork
const ChalRespCalculator = {
    challenge() {
        return Promise.reject(new Error('Challenge-response not supported in web app'));
    },
    build(/* chalResp */) {
        // No-op: challenge-response not supported in web-only fork.
        // Returns null so kdbxweb treats it as no challenge-response.
        return null;
    },
    clearCache(/* chalResp */) {
        // No-op: nothing to clear in web-only fork.
    }
};
export { ChalRespCalculator };
