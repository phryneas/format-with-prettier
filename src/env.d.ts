import { BuiltInParserName } from "prettier";
import { Browser } from "webextension-polyfill";
declare global {
  const browser: Browser;
  function __prettierTextArea(parser: BuiltInParserName): void;
}
