// Stub: YubiKey challenge-response removed in web-only fork
const ChalRespCalculator = {
    challenge() {
        return Promise.reject(new Error('Challenge-response not supported in web app'));
    }
};
export { ChalRespCalculator };
