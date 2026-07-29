/**
 * Shared ESLint rules for production code quality (file size, JSDoc, typing, naming).
 * @type {import('eslint').Linter.RulesRecord}
 */
export const qualityRules = {
  'max-lines': [
    'error',
    { max: 800, skipBlankLines: true, skipComments: true },
  ],
  '@typescript-eslint/no-explicit-any': 'error',
  'id-length': [
    'error',
    {
      min: 3,
      exceptions: ['i', 'j', 'k', 'id', 'ok', 'req', 'res', 'url'],
      properties: 'never',
    },
  ],
  'id-denylist': ['error', 'temp', 'foo', 'handleStuff', 'fn', 'x'],
  'no-restricted-syntax': [
    'error',
    {
      selector: 'VariableDeclarator > Identifier[name="data"]',
      message: 'Use a descriptive variable name instead of "data".',
    },
    {
      selector: 'FunctionDeclaration > Identifier[name="data"]',
      message: 'Use a descriptive function name instead of "data".',
    },
  ],
  'jsdoc/require-jsdoc': [
    'error',
    {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: false,
        ArrowFunctionExpression: false,
        FunctionExpression: true,
      },
      contexts: [
        'ArrowFunctionExpression > VariableDeclarator',
        'FunctionExpression > VariableDeclarator',
      ],
    },
  ],
  'jsdoc/require-param': 'error',
  'jsdoc/require-param-description': 'error',
  'jsdoc/require-returns': 'error',
  'jsdoc/check-param-names': 'error',
  'jsdoc/require-param-type': 'error',
  'jsdoc/require-returns-type': 'error',
};

/**
 * Relaxed rules for test files.
 * @type {import('eslint').Linter.RulesRecord}
 */
export const testFileRuleOverrides = {
  'jsdoc/require-jsdoc': 'off',
  'jsdoc/require-param': 'off',
  'jsdoc/require-param-description': 'off',
  'jsdoc/require-returns': 'off',
  'jsdoc/check-param-names': 'off',
  'jsdoc/require-param-type': 'off',
  'jsdoc/require-returns-type': 'off',
};
