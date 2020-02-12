const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const {
    HotModuleReplacementFilterPlugin
} = require('hmr-filter-webpack-plugin');
const glob = require('glob');

module.exports = {
    entry: glob.sync('./src/**/*.{ts}').reduce((acc, file) => {
        acc[file.replace(/^\.\/src\//, '')] = file;
        return acc;
    }, {}),
    watch: false,
    target: 'node',
    module: {
        rules: [
            {
                test: /.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    mode: 'development',
    resolve: {
        extensions: ['.ts', '.js'],
        plugins: [new TsconfigPathsPlugin()]
    },
    output: {
        filename: "[name].js",
        chunkFilename: "[name]-[id].js",
        path: __dirname + "/dist"
    },
};
