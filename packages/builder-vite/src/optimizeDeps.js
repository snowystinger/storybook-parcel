"use strict";
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
exports.getOptimizeDeps = void 0;
const path = __importStar(require("path"));
const vite_1 = require("vite");
const list_stories_1 = require("./list-stories");
const INCLUDE_CANDIDATES = [
    '@base2/pretty-print-object',
    '@emotion/core',
    '@emotion/is-prop-valid',
    '@emotion/styled',
    '@mdx-js/react',
    '@storybook/addon-docs > acorn-jsx',
    '@storybook/addon-docs',
    '@storybook/channel-postmessage',
    '@storybook/channel-websocket',
    '@storybook/client-api',
    '@storybook/client-logger',
    '@storybook/core/client',
    '@storybook/preview-api',
    '@storybook/preview-web',
    '@storybook/react > acorn-jsx',
    '@storybook/react',
    '@storybook/svelte',
    '@storybook/types',
    '@storybook/vue3',
    'acorn-jsx',
    'acorn-walk',
    'acorn',
    'airbnb-js-shims',
    'ansi-to-html',
    'axe-core',
    'color-convert',
    'deep-object-diff',
    'doctrine',
    'emotion-theming',
    'escodegen',
    'estraverse',
    'fast-deep-equal',
    'global',
    'html-tags',
    'isobject',
    'jest-mock',
    'loader-utils',
    'lodash/cloneDeep',
    'lodash/isFunction',
    'lodash/isPlainObject',
    'lodash/isString',
    'lodash/mapKeys',
    'lodash/mapValues',
    'lodash/pick',
    'lodash/pickBy',
    'lodash/startCase',
    'lodash/throttle',
    'lodash/uniq',
    'markdown-to-jsx',
    'memoizerific',
    'overlayscrollbars',
    'polished',
    'prettier/parser-babel',
    'prettier/parser-flow',
    'prettier/parser-typescript',
    'prop-types',
    'qs',
    'react-dom',
    'react-dom/client',
    'react-fast-compare',
    'react-is',
    'react-textarea-autosize',
    'react',
    'react/jsx-runtime',
    'refractor/core',
    'refractor/lang/bash.js',
    'refractor/lang/css.js',
    'refractor/lang/graphql.js',
    'refractor/lang/js-extras.js',
    'refractor/lang/json.js',
    'refractor/lang/jsx.js',
    'refractor/lang/markdown.js',
    'refractor/lang/markup.js',
    'refractor/lang/tsx.js',
    'refractor/lang/typescript.js',
    'refractor/lang/yaml.js',
    'regenerator-runtime/runtime.js',
    'slash',
    'store2',
    'synchronous-promise',
    'telejson',
    'ts-dedent',
    'unfetch',
    'util-deprecate',
    'uuid-browser/v4',
    'vue',
    'warning',
];
/**
 * Helper function which allows us to `filter` with an async predicate.  Uses Promise.all for performance.
 */
const asyncFilter = async (arr, predicate) => Promise.all(arr.map(predicate)).then((results) => arr.filter((_v, index) => results[index]));
async function getOptimizeDeps(config, options) {
    const { root = process.cwd() } = config;
    const absoluteStories = await (0, list_stories_1.listStories)(options);
    const stories = absoluteStories.map((storyPath) => (0, vite_1.normalizePath)(path.relative(root, storyPath)));
    // TODO: check if resolveConfig takes a lot of time, possible optimizations here
    const resolvedConfig = await (0, vite_1.resolveConfig)(config, 'serve', 'development');
    // This function converts ids which might include ` > ` to a real path, if it exists on disk.
    // See https://github.com/vitejs/vite/blob/67d164392e8e9081dc3f0338c4b4b8eea6c5f7da/packages/vite/src/node/optimizer/index.ts#L182-L199
    const resolve = resolvedConfig.createResolver({ asSrc: false });
    const include = await asyncFilter(INCLUDE_CANDIDATES, async (id) => Boolean(await resolve(id)));
    const optimizeDeps = {
        // We don't need to resolve the glob since vite supports globs for entries.
        entries: stories,
        // We need Vite to precompile these dependencies, because they contain non-ESM code that would break
        // if we served it directly to the browser.
        include,
    };
    return optimizeDeps;
}
exports.getOptimizeDeps = getOptimizeDeps;
