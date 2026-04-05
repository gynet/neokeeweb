const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootDir = __dirname;
const pkg = require('./package.json');

process.noDeprecation = true;

module.exports = (env, argv) => {
    const mode = argv.mode || 'development';
    const devMode = mode === 'development';

    const dt = new Date().toISOString().replace(/T.*/, '');
    const year = new Date().getFullYear();

    return {
        mode,
        entry: {
            app: path.join(rootDir, 'app/scripts/app.ts')
        },
        output: {
            path: path.resolve(rootDir, 'dist'),
            filename: 'js/[name].js',
            clean: true
        },
        target: 'web',
        performance: {
            hints: false
        },
        resolve: {
            extensions: ['.ts', '.js', '.json', '.hbs'],
            modules: [
                path.join(rootDir, 'app/scripts'),
                path.join(rootDir, 'app/styles'),
                path.join(rootDir, 'node_modules'),
                path.join(rootDir, '../../node_modules')
            ],
            alias: {
                // Module aliases matching app/scripts/ directories
                comp: path.join(rootDir, 'app/scripts/comp'),
                models: path.join(rootDir, 'app/scripts/models'),
                views: path.join(rootDir, 'app/scripts/views'),
                util: path.join(rootDir, 'app/scripts/util'),
                storage: path.join(rootDir, 'app/scripts/storage'),
                framework: path.join(rootDir, 'app/scripts/framework'),
                const: path.join(rootDir, 'app/scripts/const'),
                collections: path.join(rootDir, 'app/scripts/collections'),
                presenters: path.join(rootDir, 'app/scripts/presenters'),
                plugins: path.join(rootDir, 'app/scripts/plugins'),
                locales: path.join(rootDir, 'app/scripts/locales'),
                'auto-type': path.join(rootDir, 'app/scripts/auto-type'),
                'hbs-helpers': path.join(rootDir, 'app/scripts/hbs-helpers'),

                // Template and resource aliases
                templates: path.join(rootDir, 'app/templates'),
                'public-key.pem': path.join(rootDir, 'app/resources/public-key.pem'),
                'public-key-new.pem': path.join(rootDir, 'app/resources/public-key-new.pem'),
                'demo.kdbx': path.join(rootDir, 'app/resources/Demo.kdbx'),

                // Library aliases
                jquery: `jquery/dist/jquery${devMode ? '' : '.min'}.js`,
                morphdom: `morphdom/dist/morphdom-umd${devMode ? '' : '.min'}.js`,
                kdbxweb: path.resolve(rootDir, '../../packages/db/dist/kdbxweb.js'),
                baron: `baron/baron${devMode ? '' : '.min'}.js`,
                qrcode: `jsqrcode/dist/qrcode${devMode ? '' : '.min'}.js`,
                argon2: 'argon2-browser/dist/argon2.js',
                marked: devMode ? 'marked/lib/marked.js' : 'marked/marked.min.js',
                dompurify: `dompurify/dist/purify${devMode ? '' : '.min'}.js`,
                tweetnacl: `tweetnacl/nacl${devMode ? '' : '.min'}.js`,
                hbs: 'handlebars/runtime.js',
                'argon2-wasm': 'argon2-browser/dist/argon2.wasm',
                'fontawesome.woff2':
                    '@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2'
            },
            fallback: {
                console: false,
                process: false,
                crypto: false,
                Buffer: false,
                __filename: false,
                __dirname: false,
                fs: false,
                setImmediate: false,
                path: false,
                moment: false
            }
        },
        resolveLoader: {
            modules: ['node_modules', path.join(rootDir, 'build/loaders')]
        },
        module: {
            rules: [
                // TypeScript (for new .ts files during migration)
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                },
                // Handlebars templates
                {
                    test: /\.hbs$/,
                    use: [
                        {
                            loader: 'handlebars-loader',
                            options: {
                                knownHelpers: fs
                                    .readdirSync(
                                        path.join(rootDir, 'app/scripts/hbs-helpers')
                                    )
                                    .map((f) => f.replace(/\.(js|ts)$/, ''))
                                    .filter((f) => f !== 'index'),
                                partialResolver(partial, callback) {
                                    const location = path.join(
                                        rootDir,
                                        'app/templates/partials',
                                        `${partial}.hbs`
                                    );
                                    callback(null, location);
                                }
                            }
                        },
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: /\r?\n\s*/g,
                                replace: '\n'
                            }
                        }
                    ]
                },
                // Runtime info string replacements
                {
                    test: /runtime-info\.js$/,
                    loader: 'string-replace-loader',
                    options: {
                        multiple: [
                            {
                                search: /@@VERSION/g,
                                replace: pkg.version
                            },
                            {
                                search: /@@BETA/g,
                                replace: ''
                            },
                            { search: /@@DATE/g, replace: dt },
                            {
                                search: /@@COMMIT/g,
                                replace: 'dev'
                            },
                            { search: /@@DEVMODE/g, replace: devMode ? '1' : '' },
                            { search: /@@APPLE_TEAM_ID/g, replace: '' }
                        ]
                    }
                },
                // Baron scrollbar library
                {
                    test: /baron(\.min)?\.js$/,
                    use: [
                        {
                            loader: 'string-replace-loader',
                            options: {
                                search: /\(1,\s*eval\)\('this'\)/g,
                                replace: 'window'
                            }
                        },
                        {
                            loader: 'exports-loader',
                            options: {
                                type: 'module',
                                exports: 'default baron'
                            }
                        }
                    ]
                },
                // Handlebars source map stripping
                { test: /handlebars/, loader: 'strip-sourcemap-loader' },
                // Argon2 special handling
                {
                    test: /argon2\.wasm/,
                    type: 'javascript/auto',
                    loader: 'base64-loader'
                },
                { test: /argon2(\.min)?\.js/, loader: 'raw-loader' },
                // SCSS/CSS
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: 'css-loader', options: { sourceMap: devMode } },
                        { loader: 'postcss-loader', options: { sourceMap: devMode } },
                        { loader: 'sass-loader', options: { sourceMap: devMode } },
                        { loader: 'scss-add-icons-loader' }
                    ]
                },
                // Font Awesome custom font builder
                { test: /fontawesome.*\.woff2$/, loader: 'fontawesome-loader' },
                // Raw files
                { test: /\.pem$/, loader: 'raw-loader' },
                { test: /\.kdbx$/, loader: 'base64-loader' }
            ]
        },
        plugins: [
            new webpack.BannerPlugin(
                'neokeeweb v' +
                    pkg.version +
                    ', (c) ' +
                    year +
                    ' ' +
                    (typeof pkg.author === 'string' ? pkg.author : pkg.author.name) +
                    ', opensource.org/licenses/' +
                    pkg.license
            ),
            new webpack.ProvidePlugin({
                $: 'jquery'
            }),
            new webpack.IgnorePlugin({ resourceRegExp: /^(moment)$/ }),
            new MiniCssExtractPlugin({
                filename: 'css/[name].css'
            }),
            new HtmlWebpackPlugin({
                template: path.join(rootDir, 'app/index.html'),
                inject: false
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: path.join(rootDir, 'app/icons'), to: 'icons' },
                    { from: path.join(rootDir, 'app/manifest'), to: '.' }
                ]
            })
        ],
        externals: {
            xmldom: 'null',
            '@xmldom/xmldom': 'null',
            crypto: 'null',
            fs: 'null',
            path: 'null'
        },
        devtool: devMode ? 'source-map' : undefined,
        devServer: {
            static: {
                directory: path.join(rootDir, 'app')
            },
            port: 8085,
            hot: true,
            open: false,
            historyApiFallback: true,
            client: {
                overlay: false
            }
        }
    };
};
