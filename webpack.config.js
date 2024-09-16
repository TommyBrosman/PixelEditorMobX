/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env) => {
	const mode = env?.prod ? "production" : "development";

	return {
		devtool: "inline-source-map",
		entry: {
			app: "./src/index.tsx",
		},
		mode,
		module: {
			rules: [
				// Necessary in order to use TypeScript
				{
					test: /\.ts$|tsx/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.css$/,
					use: [
						{
							loader: "style-loader",
						},
						{
							loader: "css-loader",
						},
					],
				},
			],
		},
		resolve: {
			extensionAlias: {
				".js": [".ts", ".tsx", ".js", ".cjs", ".mjs"],
			},
			extensions: [".ts", ".tsx", ".js", ".cjs", ".mjs"],
		},
		output: {
			filename: "bundle.js",
			path: path.resolve(__dirname, "dist"),
			// This line is VERY important for VS Code debugging to attach properly
			// Tamper with it at your own risks
			devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			clean: true,
		},
		plugins: [
			// No need to write a index.html
			new HtmlWebpackPlugin({
				title: "Pixel Editor",
				favicon: "",
				template: "./src/index.html"
			}),
		],
		devServer: {
			open: false,
		},
	};
};
