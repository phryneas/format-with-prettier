import { AvailableParser } from "./plugins";
import { storage } from "webextension-polyfill";

const defaultPrettierOptions = `{
  // see https://prettier.io/docs/en/options.html
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
  /**
   * Here you can specify parsers of plugins that should be loaded,
   * even if they are not checked down below.
   * E.g. if you only want the "Markdown" context menu,
   * but still want js blocks to be formatted, you can set:
   * extraParsers: [ 'babel' ]
   */
  extraParsers: [],
}
`;

export const defaultOptions = {
  enabledParsers: ["babel", "typescript", "markdown", "html", "json5"] as AvailableParser[],
  prettierOptions: defaultPrettierOptions,
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
