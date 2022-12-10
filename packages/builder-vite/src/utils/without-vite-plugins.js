"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withoutVitePlugins = void 0;
// recursively remove all plugins with the given names
const withoutVitePlugins = (plugins = [], namesToRemove) => plugins.map((plugin) => {
    if (Array.isArray(plugin)) {
        return (0, exports.withoutVitePlugins)(plugin, namesToRemove);
    }
    if (plugin && 'name' in plugin && namesToRemove.includes(plugin.name)) {
        return false;
    }
    return plugin;
});
exports.withoutVitePlugins = withoutVitePlugins;