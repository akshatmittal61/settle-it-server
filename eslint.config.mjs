import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
	{
		languageOptions: { globals: globals.browser },
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
			"no-use-before-define": "error",
			quotes: ["error", "double"],
			semi: ["error", "always"],
			"no-explicit-any": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"no-console": "warn",
		},
	},
	{
		ignores: [
			"**/build/**/*",
			"coverage/**",
			"docs/**",
			"!/docs/.eleventy.js",
			"jsdoc/**",
			"templates/**",
			"tests/bench/**",
			"tests/fixtures/**",
			"tests/performance/**",
			"tmp/**",
			"node_modules/**",
			"test.js",
			"!.eslintrc.js",
			"!.prettierrc.js",
			"!.stylelintrc.js",
			"!.travis.yml",
			"!.babelrc",
			"!.editorconfig",
			"!.gitattributes",
			"!.gitignore",
			"!.npmignore",
			"!.nvmrc",
			"!.vscode/**",
			"!.next/**",
		],
	},
];
