import type {
  BuiltInParserName,
  Options as FormatOptions,
  Plugin,
} from "prettier";
import { FormatRequest, FormatResponse } from "./types";

function requireWebAccessibleResource(mod: string) {
  const url = browser.runtime.getURL(`up_/node_modules/${mod}.js`);
  console.log(url);
  return import(url);
}

async function __prettierTextArea(parser: BuiltInParserName) {
  console.log({ parser });
  try {
    const element = [
      document.activeElement,
      document.querySelector(":focus"),
    ].find(
      (element): element is HTMLInputElement | HTMLTextAreaElement =>
        !!element &&
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement)
    );

    if (!element) return;

    const options: FormatOptions = {
      parser,
    };
    if (
      element.selectionStart != null &&
      element.selectionEnd != null &&
      element.selectionStart != element.selectionEnd
    ) {
      options.rangeStart = element.selectionStart;
      options.rangeEnd = element.selectionEnd;
    }
    const request: FormatRequest = {
      code: element.value,
      options,
    };
    const response: FormatResponse = await browser.runtime.sendMessage(request);
    element.value = response.formatted;
  } catch (e) {
    console.log(e);
  }
}

window.__prettierTextArea = __prettierTextArea;
