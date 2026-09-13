// ESLint flat config. Next 16 removed the `next lint` command, so linting is
// run through ESLint directly (`npm run lint`) against this file rather than
// through a Next subcommand.
//
// `eslint-config-next` already bundles the Next, React, React Hooks,
// import and jsx-a11y plugins and the TypeScript parser, so this file adds
// the shared configs and the ignore list, and nothing else.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  {
    // Build output, dependencies, and the checked-in example life — the last
    // is sample *data* (Markdown and its front matter), not source, and has
    // no lint rules that meaningfully apply to it.
    ignores: [".next/**", "node_modules/**", ".ohmylife/**", "examples/**"],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Two narrow adjustments to how "unused" is defined. Neither weakens
      // what the rule catches; both describe a deliberate pattern already
      // used throughout this codebase.
      //
      // `ignoreRestSiblings` covers omitting a key by destructuring it out
      // (`const { archived_at: _archivedAt, ...rest } = entry`). The binding
      // is required for the omission to happen at all, so flagging it as
      // unused reports the mechanism rather than a mistake. This is also
      // what typescript-eslint's own recommended config sets.
      //
      // The `^_` patterns make "I am deliberately not using this" explicit
      // at the binding site, where a reader sees it, rather than in a
      // disable comment.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default config;
