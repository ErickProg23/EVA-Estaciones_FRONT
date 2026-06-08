module.exports = {
  root: true,
  env: {
    node: true,
    "vue/setup-compiler-macros": true,
  },
  parser: "vue-eslint-parser",
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
  ],
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
    babelOptions: { presets: ["@vue/cli-plugin-babel/preset"] }
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-empty": "off",
    "no-useless-catch": "off",
    "no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_"
    }],
    "vue/valid-v-slot": ["warn", { allowModifiers: true }],
    "vue/no-unused-vars": "warn"
  },
};
