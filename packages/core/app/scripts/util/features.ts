const MobileRegex = /iPhone|iPad|iPod|Android|BlackBerry|Opera Mini|IEMobile|WPDesktop|Windows Phone|webOS/i;
const MinDesktopScreenWidth = 800;

// `Navigator.standalone` is a non-standard Safari iOS field. `Window.chrome`
// is a Chromium-only flag. TS doesn't know about either; we cast to any
// for the property reads. Both are read-only feature detections.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navAny = navigator as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const winAny = window as any;

interface FeaturesShape {
    isDesktop: boolean;
    isMac: boolean;
    isWindows: boolean;
    isiOS: boolean;
    isMobile: boolean;
    isPopup: boolean;
    isStandalone: boolean;
    isFrame: boolean;
    isSelfHosted: boolean;
    isLocal: boolean;
    _browserIcon?: string;
    readonly supportsTitleBarStyles: boolean;
    readonly supportsCustomTitleBarAndDraggableWindow: boolean;
    readonly renderCustomTitleBar: boolean;
    readonly hasUnicodeFlags: boolean;
    readonly browserCssClass: string;
    readonly browserIcon: string;
    readonly supportsBrowserExtensions: boolean;
    readonly extensionBrowserFamily: 'Firefox' | 'Edge' | 'Chrome' | 'Safari';
}

const Features: FeaturesShape = {
    isDesktop: false,
    isMac: navigator.platform.indexOf('Mac') >= 0,
    isWindows: navigator.platform.indexOf('Win') >= 0,
    isiOS: /iPad|iPhone|iPod/i.test(navigator.userAgent),
    isMobile: MobileRegex.test(navigator.userAgent) || screen.width < MinDesktopScreenWidth,
    isPopup: !!(window.parent !== window.top || window.opener),
    isStandalone: !!navAny.standalone,
    isFrame: window.top !== window,
    isSelfHosted: !/^http(s?):\/\/((localhost:8085)|((app|beta)\.keeweb\.info))/.test(location.href),
    isLocal: location.origin.indexOf('localhost') >= 0,

    get supportsTitleBarStyles() {
        return false;
    },
    get supportsCustomTitleBarAndDraggableWindow() {
        return false;
    },
    get renderCustomTitleBar() {
        return false;
    },
    get hasUnicodeFlags() {
        return this.isMac;
    },
    get browserCssClass() {
        if (winAny.chrome && window.navigator.userAgent.indexOf('Chrome/') > -1) {
            return 'chrome';
        }
        if (window.navigator.userAgent.indexOf('Edge/') > -1) {
            return 'edge';
        }
        if (navAny.standalone) {
            return 'standalone';
        }
        return '';
    },
    get browserIcon() {
        if (this._browserIcon) {
            return this._browserIcon;
        }

        if (/Gecko\//.test(navigator.userAgent)) {
            this._browserIcon = 'firefox-browser';
        } else if (/Edg\//.test(navigator.userAgent)) {
            this._browserIcon = 'edge';
        } else if (/Chrome\//.test(navigator.userAgent)) {
            this._browserIcon = 'chrome';
        } else if (this.isMac && /Safari\//.test(navigator.userAgent)) {
            this._browserIcon = 'safari';
        } else {
            this._browserIcon = 'window-maximize';
        }

        return this._browserIcon;
    },
    get supportsBrowserExtensions() {
        return !this.isMobile;
    },
    get extensionBrowserFamily() {
        if (/Gecko\//.test(navigator.userAgent)) {
            return 'Firefox';
        } else if (/Edg\//.test(navigator.userAgent)) {
            return 'Edge';
        } else if (/Chrome\//.test(navigator.userAgent)) {
            return 'Chrome';
        } else if (this.isMac && /Safari\//.test(navigator.userAgent)) {
            return 'Safari';
        } else {
            return 'Chrome';
        }
    }
};

export { Features };
