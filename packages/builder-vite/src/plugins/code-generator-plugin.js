"use strict";
/* eslint-disable no-param-reassign */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeGeneratorPlugin = void 0;
const fs = __importStar(require("fs"));
const vite_1 = require("vite");
const transform_iframe_html_1 = require("../transform-iframe-html");
const codegen_iframe_script_1 = require("../codegen-iframe-script");
const codegen_modern_iframe_script_1 = require("../codegen-modern-iframe-script");
const codegen_importfn_script_1 = require("../codegen-importfn-script");
const codegen_entries_1 = require("../codegen-entries");
const codegen_set_addon_channel_1 = require("../codegen-set-addon-channel");
const virtual_file_names_1 = require("../virtual-file-names");
function codeGeneratorPlugin(options) {
    const iframePath = require.resolve('@storybook/builder-vite/input/iframe.html');
    let iframeId;
    // noinspection JSUnusedGlobalSymbols
    return {
        name: 'storybook:code-generator-plugin',
        enforce: 'pre',
        configureServer(server) {
            // invalidate the whole vite-app.js script on every file change.
            // (this might be a little too aggressive?)
            server.watcher.on('change', () => {
                const appModule = server.moduleGraph.getModuleById(virtual_file_names_1.virtualFileId);
                if (appModule) {
                    server.moduleGraph.invalidateModule(appModule);
                }
                const storiesModule = server.moduleGraph.getModuleById(virtual_file_names_1.virtualStoriesFile);
                if (storiesModule) {
                    server.moduleGraph.invalidateModule(storiesModule);
                }
            });
            // Adding new story files is not covered by the change event above. So we need to detect this and trigger
            // HMR to update the importFn.
            server.watcher.on('add', (path) => {
                // TODO maybe use the stories declaration in main
                if (/\.stories\.([tj])sx?$/.test(path) || /\.(story|stories).mdx$/.test(path)) {
                    // We need to emit a change event to trigger HMR
                    server.watcher.emit('change', virtual_file_names_1.virtualStoriesFile);
                }
            });
        },
        config(config, { command }) {
            // If we are building the static distribution, add iframe.html as an entry.
            // In development mode, it's not an entry - instead, we use an express middleware
            // to serve iframe.html. The reason is that Vite's dev server (at the time of writing)
            // does not support virtual files as entry points.
            if (command === 'build') {
                if (!config.build) {
                    config.build = {};
                }
                config.build.rollupOptions = {
                    ...config.build.rollupOptions,
                    input: iframePath,
                };
            }
            // Detect if react 18 is installed.  If not, alias it to a virtual placeholder file.
            try {
                require.resolve('react-dom/client', { paths: [config.root || process.cwd()] });
            }
            catch (e) {
                if (isNodeError(e) && e.code === 'MODULE_NOT_FOUND') {
                    config.resolve = (0, vite_1.mergeConfig)(config.resolve ?? {}, {
                        alias: {
                            'react-dom/client': require.resolve('@storybook/builder-vite/input/react-dom-client-placeholder.js'),
                        },
                    });
                }
            }
        },
        configResolved(config) {
            iframeId = `${config.root}/iframe.html`;
        },
        resolveId(source) {
            if (source === virtual_file_names_1.virtualFileId) {
                return virtual_file_names_1.virtualFileId;
            }
            if (source === iframePath) {
                return iframeId;
            }
            if (source === virtual_file_names_1.virtualStoriesFile) {
                return virtual_file_names_1.virtualStoriesFile;
            }
            if (source === virtual_file_names_1.virtualPreviewFile) {
                return virtual_file_names_1.virtualPreviewFile;
            }
            if (source === virtual_file_names_1.virtualAddonSetupFile) {
                return virtual_file_names_1.virtualAddonSetupFile;
            }
            return undefined;
        },
        async load(id) {
            const storyStoreV7 = options.features?.storyStoreV7;
            if (id === virtual_file_names_1.virtualStoriesFile) {
                if (storyStoreV7) {
                    return (0, codegen_importfn_script_1.generateImportFnScriptCode)(options);
                }
                return (0, codegen_entries_1.generateVirtualStoryEntryCode)(options);
            }
            if (id === virtual_file_names_1.virtualAddonSetupFile) {
                return (0, codegen_set_addon_channel_1.generateAddonSetupCode)();
            }
            if (id === virtual_file_names_1.virtualPreviewFile && !storyStoreV7) {
                return (0, codegen_entries_1.generatePreviewEntryCode)(options);
            }
            if (id === virtual_file_names_1.virtualFileId) {
                if (storyStoreV7) {
                    return (0, codegen_modern_iframe_script_1.generateModernIframeScriptCode)(options);
                }
                return (0, codegen_iframe_script_1.generateIframeScriptCode)(options);
            }
            if (id === iframeId) {
                return fs.readFileSync(require.resolve('@storybook/builder-vite/input/iframe.html'), 'utf-8');
            }
            return undefined;
        },
        async transformIndexHtml(html, ctx) {
            if (ctx.path !== '/iframe.html') {
                return undefined;
            }
            return (0, transform_iframe_html_1.transformIframeHtml)(html, options);
        },
    };
}
exports.codeGeneratorPlugin = codeGeneratorPlugin;
// Refines an error received from 'catch' to be a NodeJS exception
const isNodeError = (error) => error instanceof Error;
