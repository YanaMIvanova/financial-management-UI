module.exports = {
    root: true,
    extends: ['react-app', 'prettier'],
    plugins: ['import'],
    env: {
        browser: true,
        es2022: true,
    },
    rules: {
        'linebreak-style': ['error', 'unix'],
        eqeqeq: ['error', 'smart'],
        yoda: ['error', 'never', { exceptRange: true }],
        'object-shorthand': 'error',
        'no-useless-rename': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-console': 'warn',
        'no-unused-vars': 'warn',
        'no-param-reassign': 'error',
        'no-shadow': 'error',
        'no-unsafe-optional-chaining': ['error', { disallowArithmeticOperators: true }],
        'no-lone-blocks': 'error',
        'no-return-assign': 'error',
        'no-self-compare': 'error',
        'no-undef-init': 'error',
        'no-use-before-define': 'error',
        'no-void': 'error',
        'no-cond-assign': 'error',
        'no-const-assign': 'error',
        'no-func-assign': 'error',
        'no-plusplus': 'error',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-arrow-callback': 'error',
        'prefer-const': 'error',
        'prefer-template': 'error',
        'prefer-object-has-own': 'warn',
        'import/no-absolute-path': 'error',
        'import/no-self-import': 'error',
        'import/no-cycle': 'error',
        'import/named': 'error',
        'import/no-duplicates': 'warn',
        'import/no-default-export': 'warn',
        'import/no-namespace': 'warn',
    },
}
