const MobileRegex = /iPhone|iPad|iPod|Android|BlackBerry|Opera Mini|IEMobile|WPDesktop|Windows Phone|webOS/i;
const MinDesktopScreenWidth = 800;

const Features = {
    isDesktop: false,
    isMac: navigator.platform.indexOf('Mac') >= 0,
    isWindows: navigator.platform.indexOf('Win') >= 0,
    isiOS: /iPad|iPhone|iPod/i.test(navigator.userAgent),
    isMobile: MobileRegex.test(navigator.userAgent) || screen.width < MinDesktopScreenWidth,
    isPopup: !!(window.parent !== window.top || window.opener),
    isStandalone: !!navigator.standalone,
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
        if (window.chrome && window.navigator.userAgent.indexOf('Chrome/') > -1) {
            return 'chrome';
        }
        if (window.navigator.userAgent.indexOf('Edge/') > -1) {
            return 'edge';
        }
        if (navigator.standalone) {
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
