import { Browser } from "webextension-polyfill";
import { AvailableParser } from "./plugins";
declare global {
  const browser: Browser;
  function __prettierTextArea(parser: AvailableParser): void;
}
