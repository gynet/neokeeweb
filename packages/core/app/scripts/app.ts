/* eslint-disable @typescript-eslint/no-explicit-any */
import '../styles/main.scss';
import { Events } from 'framework/events';
import { StartProfiler } from 'comp/app/start-profiler';
import { FileInfoCollection } from 'collections/file-info-collection';
import { ExportApi } from 'comp/app/export-api';
import { BrowserExtensionConnector } from 'comp/extension/browser-extension-connector';
import { FeatureTester } from 'comp/browser/feature-tester';
import { FocusDetector } from 'comp/browser/focus-detector';
import { IdleTracker } from 'comp/browser/idle-tracker';
import { ThemeWatcher } from 'comp/browser/theme-watcher';
import { KeyHandler } from 'comp/browser/key-handler';
import { SettingsManager } from 'comp/settings/settings-manager';
import { Alerts } from 'comp/ui/alerts';
import { Timeouts } from 'const/timeouts';
import { AppModel } from 'models/app-model';
import { AppSettingsModel } from 'models/app-settings-model';
import { RuntimeDataModel } from 'models/runtime-data-model';
import { UpdateModel } from 'models/update-model';
import { Features } from 'util/features';
import { KdbxwebInit } from 'util/kdbxweb/kdbxweb-init';
import { Locale } from 'util/locale';
import { AppView } from 'views/app-view';
import 'hbs-helpers';
import { Storage } from './storage';

const loc = Locale as unknown as Record<string, string>;
const features = Features as unknown as { isFrame: boolean };
const alerts = Alerts as unknown as { error(opts: any): void };
const settingsManager = SettingsManager as unknown as {
    init(): void;
    setBySettings(): void;
};
const idleTracker = IdleTracker as unknown as { init(): void };
const browserExt = BrowserExtensionConnector as unknown as { init(model: any): void };
const focusDetector = FocusDetector as unknown as { init(): void };
const themeWatcher = ThemeWatcher as unknown as { init(): void };
const featureTester = FeatureTester as unknown as { test(): Promise<void> };
const kdbxwebInit = KdbxwebInit as unknown as { init(): void };
const startProfiler = StartProfiler as unknown as {
    milestone(name: string): void;
    report(): void;
};

// Build identity — injected by webpack.DefinePlugin at build time. Emit on
// startup so the browser console, Playwright `page.evaluate`, and manual
// smoke tests can all verify the exact commit + time this bundle was built
// from. Also exposed on `window` so E2E live-drift tests can read it
// without needing source maps or bundle scraping.
console.info(
    `NeoKeeWeb build ${__NEOKEEWEB_BUILD_SHA_SHORT__} (${__NEOKEEWEB_BUILD_TIME__})`
);
(window as unknown as Record<string, unknown>).__NEOKEEWEB_BUILD_SHA__ =
    __NEOKEEWEB_BUILD_SHA__;
(window as unknown as Record<string, unknown>).__NEOKEEWEB_BUILD_SHA_SHORT__ =
    __NEOKEEWEB_BUILD_SHA_SHORT__;
(window as unknown as Record<string, unknown>).__NEOKEEWEB_BUILD_TIME__ =
    __NEOKEEWEB_BUILD_TIME__;

startProfiler.milestone('loading modules');

$(() => {
    startProfiler.milestone('document ready');

    const appModel: any = new (AppModel as any)();
    startProfiler.milestone('creating app model');

    Promise.resolve()
        .then(loadConfigs)
        .then(initModules)
        .then(loadRemoteConfig)
        .then(ensureCanRun)
        .then(initStorage)
        .then(showApp)
        .then(postInit)
        .catch((e: any) => {
            appModel.appLogger.error('Error starting app', e);
        });

    function ensureCanRun(): Promise<void> {
        if (features.isFrame && !appModel.settings.allowIframes) {
            return Promise.reject(
                'Running in iframe is not allowed (this can be changed in the app config).'
            );
        }
        return featureTester
            .test()
            .catch((e: any) => {
                alerts.error({
                    header: loc.appSettingsError,
                    body: loc.appNotSupportedError,
                    pre: e,
                    buttons: [],
                    esc: false,
                    enter: false,
                    click: false
                });
                throw 'Feature testing failed: ' + e;
            })
            .then(() => {
                startProfiler.milestone('checking features');
            });
    }

    function loadConfigs(): Promise<void> {
        return Promise.all([
            (AppSettingsModel as any).load(),
            (UpdateModel as any).load(),
            (RuntimeDataModel as any).load(),
            (FileInfoCollection as any).load()
        ]).then(() => {
            startProfiler.milestone('loading configs');
        });
    }

    function initModules(): void {
        (KeyHandler as any).init();
        kdbxwebInit.init();
        focusDetector.init();
        themeWatcher.init();
        settingsManager.init();
        (window as any).kw = ExportApi;
        startProfiler.milestone('initializing modules');
    }

    function showSettingsLoadError(): void {
        alerts.error({
            header: loc.appSettingsError,
            body: loc.appSettingsErrorBody,
            buttons: [],
            esc: false,
            enter: false,
            click: false
        });
    }

    function loadRemoteConfig(): Promise<void> {
        return Promise.resolve()
            .then(() => {
                settingsManager.setBySettings();
                const configParam = getConfigParam();
                if (configParam) {
                    return appModel
                        .loadConfig(configParam)
                        .then(() => {
                            settingsManager.setBySettings();
                        })
                        .catch((e: any) => {
                            if (!appModel.settings.cacheConfigSettings) {
                                showSettingsLoadError();
                                throw e;
                            }
                        });
                }
                return undefined;
            })
            .then(() => {
                startProfiler.milestone('loading remote config');
            });
    }

    function initStorage(): void {
        for (const prv of Object.values(Storage as unknown as Record<string, any>)) {
            prv.init();
        }
        startProfiler.milestone('initializing storage');
    }

    function showApp(): Promise<void> {
        return Promise.resolve().then(() => {
            const skipHttpsWarning =
                (localStorage as any).skipHttpsWarning || appModel.settings.skipHttpsWarning;
            const protocolIsInsecure = ['https:', 'file:', 'app:'].indexOf(location.protocol) < 0;
            const hostIsInsecure = location.hostname !== 'localhost';
            if (protocolIsInsecure && hostIsInsecure && !skipHttpsWarning) {
                return new Promise<void>((resolve) => {
                    alerts.error({
                        header: loc.appSecWarn,
                        icon: 'user-secret',
                        esc: false,
                        enter: false,
                        click: false,
                        body: loc.appSecWarnBody1 + '\n\n' + loc.appSecWarnBody2,
                        buttons: [{ result: '', title: loc.appSecWarnBtn, error: true }],
                        complete: () => {
                            showView();
                            resolve();
                        }
                    });
                });
            } else {
                showView();
                return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
            }
        });
    }

    function postInit(): void {
        setTimeout(() => {
            idleTracker.init();
            browserExt.init(appModel);
        }, (Timeouts as any).AutoUpdatePluginsAfterStart);
    }

    function showView(): void {
        new (AppView as any)(appModel).render();
        startProfiler.milestone('first view rendering');

        Events.emit('app-ready');
        startProfiler.milestone('app ready event');

        startProfiler.report();
    }

    function getConfigParam(): string | undefined {
        const metaConfig = document.head.querySelector(
            'meta[name=kw-config]'
        ) as HTMLMetaElement | null;
        if (metaConfig && metaConfig.content && metaConfig.content[0] !== '(') {
            return metaConfig.content;
        }
        const match = location.search.match(/[?&]config=([^&]+)/i);
        if (match && match[1]) {
            return match[1];
        }
        return undefined;
    }
});
