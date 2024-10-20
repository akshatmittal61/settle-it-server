import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{
		ignores: [
			"build/**/*",
			"coverage/**/*",
			"docs/**/*",
			"!docs/.eleventy.js",
			"jsdoc/**/*",
			"templates/**/*",
			"tests/bench/**/*",
			"tests/fixtures/**/*",
			"tests/performance/**/*",
			"tmp/**/*",
			"node_modules/**/*",
			"**/test.js",
			"!**/.eslintrc.js",
			"!**/.prettierrc.js",
			"!**/.stylelintrc.js",
			"!**/.travis.yml",
			"!**/.babelrc",
			"!**/.editorconfig",
			"!**/.gitattributes",
			"!**/.gitignore",
			"!**/.npmignore",
			"!**/.nvmrc",
			"!.vscode/**/*",
			"!.next/**/*",
		],
	},
	...compat.extends("eslint:recommended"),
	{
		plugins: {},

		languageOptions: {
			globals: {
				...globals.node,
			},

			ecmaVersion: "latest",
			sourceType: "module",
		},

		rules: {
			"no-unused-vars": [
				"warn",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],

			"no-console": "warn",
			"no-use-before-define": "error",
			quotes: ["error", "double"],
			semi: ["error", "always"],
		},
	},
];
