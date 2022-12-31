import { AvailableParser } from "./plugins";
import type { Options as FormatOptions } from "prettier";
import { storage } from "webextension-polyfill";

const defaultPrettierOptions: FormatOptions = {
  printWidth: 80,
  useTabs: false,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  trailingComma: "es5",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  proseWrap: "preserve",
  htmlWhitespaceSensitivity: "css",
  vueIndentScriptAndStyle: false,
  endOfLine: "auto",
  embeddedLanguageFormatting: "auto",
  singleAttributePerLine: false,
  extraParsers: [],
};

const defaultOptions = {
  enabledParsers: ["babel", "typescript", "markdown", "html", "json5"] as AvailableParser[],
  prettierOptions: JSON.stringify(defaultPrettierOptions),
};
type Options = typeof defaultOptions;

export async function getOptions() {
  return storage.sync.get(defaultOptions) as Promise<Options>;
}

export async function getOption<K extends keyof Options>(option: K): Promise<Options[K]> {
  return (await getOptions())[option];
}

export function setOption<K extends keyof Options>(option: K, value: Options[K]) {
  return storage.sync.set({ [option]: value });
}

export function onOptionChange<K extends keyof Options>(option: K, handler: () => void) {
  storage.sync.onChanged.addListener((changes) => {
    if (option in changes) {
      handler();
    }
  });
}
