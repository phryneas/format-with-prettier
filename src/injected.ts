import type { Options as FormatOptions } from "prettier";
import { getOption } from "./options";
import { AvailableParser } from "./plugins";
import { FormatRequest, FormatResponse } from "./types";

async function __prettierTextArea(parser: AvailableParser) {
  try {
    const element = [document.activeElement, document.querySelector(":focus")].find(
      (element): element is HTMLInputElement | HTMLTextAreaElement =>
        !!element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
    );

    if (!element) return;

    const options: FormatOptions = {
      parser,
    };
    if (element.selectionStart != null && element.selectionEnd != null && element.selectionStart != element.selectionEnd) {
      options.rangeStart = element.selectionStart;
      options.rangeEnd = element.selectionEnd;
    }
    const request: FormatRequest = {
      code: element.value,
      options,
    };
    const response: FormatResponse = await browser.runtime.sendMessage(request);
    if (response.error) throw new Error(response.error);
    element.value = response.formatted;
  } catch (e) {
    const msg = `formatting with parser ${parser} failed: 
    ${e?.toString()}`;
    console.log(await getOption("alertOnFormatError"));
    if (await getOption("alertOnFormatError")) {
      alert(msg);
    }
    console.error(msg);
  }
}

window.__prettierTextArea = __prettierTextArea;
