module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
      ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
      sourceType: 'module', // Allows for the use of imports
      ecmaFeatures: {
          jsx: true, // Allows for the parsing of JSX
      },
  },
  settings: {
      react: {
          version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
      },
  },
  extends: [
      'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
      'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
      'prettier', // Use eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
      // 'plugin:prettier/recommended', // Uncomment this if you want prettier errors to show as ESLint errors
  ],
  rules: {
      // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
      // e.g. "@typescript-eslint/explicit-function-return-type": "off",
      'no-console': 'warn',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
  },
};
