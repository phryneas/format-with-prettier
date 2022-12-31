import { Plugin as PrettierPlugin } from "prettier";
import { Tabs } from "webextension-polyfill";
import {
  AvailableParser,
  getEnabledParsersWithName,
  getEnabledPluginsByParserName,
} from "./plugins";
import { FormatRequest, FormatResponse } from "./types";
const prettier = import("prettier/standalone");

let getEnabledPlugins: () => Promise<PrettierPlugin[]> = async () => [];

try {
  // TODO: options
  enableContextMenu(["html", "markdown", "babel", "babel-ts", "typescript"]);

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

  browser.runtime.onMessage.addListener(
    async (request: FormatRequest): Promise<FormatResponse> => {
      const format = (await prettier).format;
      return {
        formatted: format(request.code, {
          plugins: await getEnabledPlugins(),
          embeddedLanguageFormatting: "auto",
          printWidth: 60,
          ...request.options,
        }),
      };
    }
  );
} catch (e) {
  console.log("background page error", e?.toString());
}

function enableContextMenu(activeParserNames: AvailableParser[]) {
  getEnabledPlugins = () => getEnabledPluginsByParserName(activeParserNames);
  const activeParsers = getEnabledParsersWithName(activeParserNames);
  const onlyOne = activeParsers.length == 1;
  browser.contextMenus.removeAll();
  for (const { parser, pluginName, description } of activeParsers) {
    const descriptionUnique =
      activeParsers.filter((p) => p.description == description).length == 1;
    const parserDescription = descriptionUnique
      ? description
      : `${description} (${pluginName})`;
    const title = onlyOne
      ? `Format with Prettier (${parserDescription})`
      : parserDescription;
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
