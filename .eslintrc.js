module.exports = {
    "extends": [
        "@runejs/eslint-config"
    ],
    "parserOptions": {
        "project": "./tsconfig.json"
    }
    /*"root": true,
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "semi",
                    "requireLast": true
                },
                "singleline": {
                    "delimiter": "comma",
                    "requireLast": false
                }
            }
        ],
        "@typescript-eslint/member-ordering": "error",
        "@typescript-eslint/promise-function-async": "error",
        "@typescript-eslint/quotes": [
            "error",
            "single",
            { "allowTemplateLiterals": true }
        ],
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/triple-slash-reference": "error",
        "max-len": "off",
        "object-curly-spacing": [ "error", "always" ],
        "no-var": "error",
        "prefer-const": "error",
        "indent": [
            "error", 4, {
                "SwitchCase": 1,
                "FunctionDeclaration": {
                    "parameters": "off",
                    "body": 1
                },
                "FunctionExpression": {
                    "parameters": "off",
                    "body": 1
                },
                "offsetTernaryExpressions": true
            }
        ],
        "@typescript-eslint/indent": [
            "error", 4, {
                "SwitchCase": 1,
                "FunctionDeclaration": {
                    "parameters": "off",
                    "body": 1
                },
                "FunctionExpression": {
                    "parameters": "off",
                    "body": 1
                },
                "offsetTernaryExpressions": true,
                "ignoredNodes": [
                    "ArrowFunctionExpression > BlockStatement",
                    "NoSubstitutionTemplateLiteral",
                    "TemplateLiteral",
                    "TSTypeAliasDeclaration *"
                ]
            }
        ],
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-empty-function": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/ban-types": 0,
        "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-var-requires": 0
    }*/
}
