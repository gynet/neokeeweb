/* eslint-disable @typescript-eslint/no-explicit-any */

// Extend Window/Navigator for non-standard properties used by feature detection
declare global {
    interface Window {
        process?: { versions?: { electron?: string } };
        chrome?: unknown;
    }
    interface Navigator {
        standalone?: boolean;
    }
}

const MobileRegex: RegExp =
    /iPhone|iPad|iPod|Android|BlackBerry|Opera Mini|IEMobile|WPDesktop|Windows Phone|webOS/i;
const MinDesktopScreenWidth: number = 800;

const isDesktop: boolean = !!(
    window.process &&
    window.process.versions &&
    window.process.versions.electron
);

interface FeaturesType {
    readonly isDesktop: boolean;
    readonly isMac: boolean;
    readonly isWindows: boolean;
    readonly isiOS: boolean;
    readonly isMobile: boolean;
    readonly isPopup: boolean;
    readonly isStandalone: boolean;
    readonly isFrame: boolean;
    readonly isSelfHosted: boolean;
    readonly isLocal: boolean;
    readonly supportsTitleBarStyles: boolean;
    readonly supportsCustomTitleBarAndDraggableWindow: boolean;
    readonly renderCustomTitleBar: boolean;
    readonly hasUnicodeFlags: boolean;
    readonly browserCssClass: string;
    readonly browserIcon: string;
    readonly supportsBrowserExtensions: boolean;
    readonly extensionBrowserFamily: string | undefined;
    _browserIcon?: string;
}

const Features: FeaturesType = {
    isDesktop,
    isMac: navigator.platform.indexOf('Mac') >= 0,
    isWindows: navigator.platform.indexOf('Win') >= 0,
    isiOS: /iPad|iPhone|iPod/i.test(navigator.userAgent),
    isMobile: MobileRegex.test(navigator.userAgent) || screen.width < MinDesktopScreenWidth,
    isPopup: !!(window.parent !== window.top || window.opener),
    isStandalone: !!navigator.standalone,
    isFrame: window.top !== window,
    isSelfHosted:
        !isDesktop &&
        !/^http(s?):\/\/((localhost:8085)|((app|beta)\.keeweb\.info))/.test(location.href),
    isLocal: location.origin.indexOf('localhost') >= 0,

    get supportsTitleBarStyles(): boolean {
        return isDesktop && (this.isMac || this.isWindows);
    },
    get supportsCustomTitleBarAndDraggableWindow(): boolean {
        return isDesktop && this.isMac;
    },
    get renderCustomTitleBar(): boolean {
        return isDesktop && this.isWindows;
    },
    get hasUnicodeFlags(): boolean {
        return this.isMac;
    },
    get browserCssClass(): string {
        if ((window as any).chrome && window.navigator.userAgent.indexOf('Chrome/') > -1) {
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
    get browserIcon(): string {
        if (this._browserIcon) {
            return this._browserIcon;
        }

        if (this.isDesktop) {
            (this as any)._browserIcon = this.isMac
                ? 'safari'
                : this.isWindows
                  ? 'edge'
                  : 'chrome';
        } else if (/Gecko\//.test(navigator.userAgent)) {
            (this as any)._browserIcon = 'firefox-browser';
        } else if (/Edg\//.test(navigator.userAgent)) {
            (this as any)._browserIcon = 'edge';
        } else if (/Chrome\//.test(navigator.userAgent)) {
            (this as any)._browserIcon = 'chrome';
        } else if (this.isMac && /Safari\//.test(navigator.userAgent)) {
            (this as any)._browserIcon = 'safari';
        } else {
            (this as any)._browserIcon = 'window-maximize';
        }

        return this._browserIcon!;
    },
    get supportsBrowserExtensions(): boolean {
        return !this.isMobile && (this.isDesktop || this.browserIcon !== 'safari');
    },
    get extensionBrowserFamily(): string | undefined {
        if (Features.isDesktop) {
            return undefined;
        } else if (/Gecko\//.test(navigator.userAgent)) {
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
export type { FeaturesType };
