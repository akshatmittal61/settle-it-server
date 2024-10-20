import js from "@eslint/js";

export default [
	js.configs.recommended,
	{
		rules: {
			"no-unused-vars": [
				"warn",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
				},
			],
			"no-use-before-define": "error",
			quotes: ["error", "double"],
			semi: ["error", "always"],
		},
		ignores: [
			"/build/**",
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
