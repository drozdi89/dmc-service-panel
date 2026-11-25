import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const rootPath = path.dirname(fileURLToPath(import.meta.url));

/**
 * FSD layers as element types (Vite SPA under src/).
 *
 * Slice layers (`pages` … `entities`) are matched per folder under the layer
 * (`src/<layer>/*`) so `boundaries/entry-point` can require `index.ts`.
 * `app` and `shared` stay as whole-layer folders.
 *
 * Import direction: app → pages → layouts → widgets → features → services → entities → shared.
 */
const fsdElements = [
  { type: 'app', pattern: 'src/app', partialMatch: false },
  {
    type: 'pages',
    pattern: 'src/pages/*',
    capture: ['slice'],
    partialMatch: false,
  },
  {
    type: 'layouts',
    pattern: 'src/layouts/*',
    capture: ['slice'],
    partialMatch: false,
  },
  {
    type: 'widgets',
    pattern: 'src/widgets/*',
    capture: ['slice'],
    partialMatch: false,
  },
  {
    type: 'features',
    pattern: 'src/features/*',
    capture: ['slice'],
    partialMatch: false,
  },
  {
    type: 'services',
    pattern: 'src/services/*',
    capture: ['slice'],
    partialMatch: false,
  },
  {
    type: 'entities',
    pattern: 'src/entities/*',
    capture: ['slice'],
    partialMatch: false,
  },
  { type: 'shared', pattern: 'src/shared', partialMatch: false },
];

/** Lower layers each FSD layer may import (plus self). */
const fsdDependencyPolicies = [
  {
    from: { element: { type: 'app' } },
    allow: {
      to: {
        element: {
          types: {
            anyOf: [
              'app',
              'pages',
              'layouts',
              'widgets',
              'features',
              'services',
              'entities',
              'shared',
            ],
          },
        },
      },
    },
  },
  {
    from: { element: { type: 'pages' } },
    allow: {
      to: {
        element: {
          types: {
            anyOf: [
              'pages',
              'layouts',
              'widgets',
              'features',
              'services',
              'entities',
              'shared',
            ],
          },
        },
      },
    },
  },
  {
    from: { element: { type: 'layouts' } },
    allow: {
      to: {
        element: {
          types: {
            anyOf: [
              'layouts',
              'widgets',
              'features',
              'services',
              'entities',
              'shared',
            ],
          },
        },
      },
    },
  },
  {
    from: { element: { type: 'widgets' } },
    allow: {
      to: {
        element: {
          types: {
            anyOf: ['widgets', 'features', 'services', 'entities', 'shared'],
          },
        },
      },
    },
  },
  {
    from: { element: { type: 'features' } },
    allow: {
      to: {
        element: {
          types: { anyOf: ['features', 'services', 'entities', 'shared'] },
        },
      },
    },
  },
  {
    from: { element: { type: 'services' } },
    allow: {
      to: {
        element: {
          types: { anyOf: ['services', 'entities', 'shared'] },
        },
      },
    },
  },
  {
    from: { element: { type: 'entities' } },
    allow: {
      to: {
        element: { types: { anyOf: ['entities', 'shared'] } },
      },
    },
  },
  {
    from: { element: { type: 'shared' } },
    allow: {
      to: {
        element: { types: { anyOf: ['shared'] } },
      },
    },
  },
];

/**
 * Public API of each FSD slice is `index.ts` only.
 * `app` / `shared` keep open internal paths (shared UI segments use their own barrels).
 */
const fsdEntryPointPolicies = [
  {
    target: { element: { type: 'app' } },
    // Micromatch: `*` does not cross `/`; allow any internal path under app/.
    allow: '**',
  },
  {
    target: { element: { type: 'shared' } },
    // shared uses segment barrels (`ui/loading`, `lib/admin-routing`, …), not a single root index.
    allow: '**',
  },
  {
    target: {
      element: {
        types: {
          anyOf: [
            'pages',
            'layouts',
            'widgets',
            'features',
            'services',
            'entities',
          ],
        },
      },
    },
    allow: 'index.ts',
  },
];

const modulesImportRestriction = {
  group: ['@/modules', '@/modules/*', '@/modules/**'],
  message:
    'Legacy modules/ removed (FSD #17). Import from pages/features/entities/… via public index.ts.',
};

/** Ban transport helpers outside entity api folders and shared/api (merged with modules ban). */
const nonEntityApiImportRestriction = {
  paths: [
    {
      name: '@/shared/api',
      importNames: ['apiRequest', 'apiRequestData', 'fetchPaginatedList'],
      message:
        'HTTP только в entities/*/api (транспорт shared/api). Вызывайте публичные функции entity-api.',
    },
    {
      name: '@/shared/api/client',
      importNames: ['apiRequest', 'apiRequestData'],
      message:
        'HTTP только в entities/*/api (транспорт shared/api). Вызывайте публичные функции entity-api.',
    },
    {
      name: '@/shared/api/listQuery',
      importNames: ['fetchPaginatedList'],
      message:
        'HTTP только в entities/*/api (транспорт shared/api). Вызывайте публичные функции entity-api.',
    },
    {
      name: 'axios',
      message: 'Используйте @/shared/api (http client). Прямой axios вне shared/api запрещён.',
    },
  ],
  patterns: [modulesImportRestriction],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/shared/api/schema.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      'boundaries/root-path': rootPath,
      'boundaries/elements': fsdElements,
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      // Entry / test helpers sit outside FSD layers; recommended config skips unknown files.
      'boundaries/ignore': [
        'src/main.tsx',
        'src/App.tsx',
        'src/App.render.test.tsx',
        'src/vite-env.d.ts',
        'src/test/**/*',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: path.join(rootPath, 'tsconfig.app.json'),
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Form/open reset and delayed-loading patterns — keep until React Compiler migration.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [modulesImportRestriction],
        },
      ],
      ...boundaries.configs.recommended.rules,
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            'FSD: {{from.element.types}} must not import {{to.element.types}} (imports only downward)',
          policies: fsdDependencyPolicies,
        },
      ],
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          message:
            'FSD: import {{to.element.types}} only via public index.ts (got {{to.element.fileInternalPath}})',
          policies: fsdEntryPointPolicies,
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/entities/*/api/**',
      'src/shared/api/**',
      'src/shared/lib/Axios-Interceptor.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      'no-restricted-imports': ['error', nonEntityApiImportRestriction],
    },
  },
);
