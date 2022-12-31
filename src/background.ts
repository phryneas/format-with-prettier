import type { Options as FormatOptions } from "prettier";
import type { Tabs } from "webextension-polyfill";
import { getOption, onOptionChange } from "./options";
import { AvailableParser, getEnabledParsersWithName, getEnabledPluginsByParserName } from "./plugins";
import type { FormatRequest, FormatResponse } from "./types";
import { parse as parseJson } from "json5";

const prettier = import("prettier/standalone");

(async function () {
  try {
    browser.contextMenus.onClicked.addListener(async (info, tab) => {
      try {
        if (!tab || typeof info.menuItemId != "string") return;
        const match = /^prettier-textarea-(.*)$/.exec(info.menuItemId);
        if (match) {
          const parser = match[1];

          await ensureScriptLoaded(tab);
          await browser.tabs.executeScript(tab.id, {
            code: `__prettierTextArea(${JSON.stringify(parser)})`,
          });
        }
      } catch (e) {
        console.error("an error occured", e?.toString());
      }
    });

    browser.runtime.onMessage.addListener(async (request: FormatRequest): Promise<FormatResponse> => {
      try {
        const format = (await prettier).format;
        const { extraParsers = [], ...requestOptions } = request.options;

        const options: FormatOptions = {
          ...parseJson(await getOption("prettierOptions")),
          ...requestOptions,
          ...parseJson(request.unparsedOptions ?? "{}"),
          plugins: await getEnabledPluginsByParserName([
            ...extraParsers,
            ...(await getOption("enabledParsers")),
            requestOptions.parser as AvailableParser,
          ]),
        };
        if (await getOption("rethrowEmbedErrors")) {
          globalThis.PRETTIER_DEBUG = true;
        }
        return {
          formatted: format(request.code, options),
        };
      } catch (e) {
        return {
          formatted: request.code,
          error: `Error while formatting: 
${e?.toString()}`,
        };
      } finally {
        globalThis.PRETTIER_DEBUG = undefined;
      }
    });

    onOptionChange("enabledParsers", refreshContextMenu);
    await refreshContextMenu();
  } catch (e) {
    console.error("background page error", e?.toString());
  }
})();

async function refreshContextMenu() {
  const activeParsers = getEnabledParsersWithName(await getOption("enabledParsers"));
  const onlyOne = activeParsers.length == 1;
  browser.contextMenus.removeAll();
  for (const { parser, pluginName, description } of activeParsers) {
    const descriptionUnique = activeParsers.filter((p) => p.description == description).length == 1;
    const parserDescription = descriptionUnique ? description : `${description} (${pluginName})`;
    const title = onlyOne ? `Format with Prettier (${parserDescription})` : parserDescription;
    browser.contextMenus.create({
      id: `prettier-textarea-${parser}`,
      title,
      contexts: ["editable"],
    });
  }
}

async function ensureScriptLoaded(currentTab: Tabs.Tab) {
  const results = await browser.tabs.executeScript(currentTab.id, {
    code: "typeof __prettierTextArea === 'function';",
  });

  if (!results || results[0] !== true) {
    const file = new URL("injected.ts", import.meta.url).toString();
    return browser.tabs.executeScript(currentTab.id, { file });
  }
}
