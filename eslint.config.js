import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dist-demo', 'dev-dist', 'supabase/functions', 'mobile'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-syntax': [
        'error',
        { selector: "JSXOpeningElement[name.name='button']", message: 'Use the shadcn <Button> from @/components/ui/button.' },
      ],
    },
  },
  {
    files: ['src/components/ui/**'],
    rules: { 'no-restricted-syntax': 'off', 'react-refresh/only-export-components': 'off' },
  },
)
