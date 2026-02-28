const globals = require("globals");
const pluginJs = require("@eslint/js");

module.exports = [
    {
        ignores: ["dist/**", "node_modules/**"]
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ["**/__tests__/**/*.js", "**/*.test.js", "**/*.spec.js"],
        languageOptions: {
            globals: {
                ...globals.jest
            }
        }
    },
    pluginJs.configs.recommended,
    {
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
        }
    }
];
