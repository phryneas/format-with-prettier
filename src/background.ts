import type { BuiltInParserName } from "prettier";
import { Tabs } from "webextension-polyfill";
import { FormatRequest, FormatResponse } from "./types";

// imports via dynamic import to force bundle splitting
const plugins = Promise.all([
  import("prettier/parser-babel"),
  import("prettier/parser-graphql"),
  import("prettier/parser-html"),
  import("prettier/parser-markdown"),
  import("prettier/parser-postcss"),
  // import("prettier/parser-typescript"), // too large, FF has 4MB file limit
  import("prettier/parser-yaml"),
]);
const prettier = import("prettier/standalone");

const parsers: Partial<Record<BuiltInParserName, string>> = {
  // acorn: "JavaScript (Acorn)",
  // angular: "Angular",
  babel: "JavaScript",
  "babel-ts": "TypeScript",
  "babel-flow": "Flow",
  css: "CSS",
  // espree: "JavaScript (Espree)",
  // flow: "Flow",
  // glimmer: "Glimmer",
  graphql: "GraphQL",
  html: "HTML",
  json: "JSON",
  json5: "JSON5",
  // "json-stringify": "JSON-Stringify",
  less: "Less",
  // lwc: "HTML (Lwc)",
  markdown: "Markdown",
  mdx: "MdX",
  // meriyah: "JavaScript (Meriyah)",
  scss: "Sass",
  // typescript: "TypeScript",
  vue: "Vue",
  yaml: "YAML",
};

// TODO: options
enableContextMenu(Object.keys(parsers));

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

function enableContextMenu(activeParserNames: string[]) {
  const activeParsers = Object.entries(parsers).filter(([parser]) =>
    activeParserNames.includes(parser)
  );

  const onlyOne = activeParsers.length == 1;
  browser.contextMenus.removeAll();
  for (const [parser, name] of activeParsers) {
    browser.contextMenus.create({
      id: `prettier-textarea-${parser}`,
      title: onlyOne ? `Format with Prettier (${name})` : name,
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

browser.runtime.onMessage.addListener(
  async (request: FormatRequest): Promise<FormatResponse> => {
    const format = (await prettier).format;
    return {
      formatted: format(request.code, {
        plugins: await plugins,
        embeddedLanguageFormatting: "auto",
        printWidth: 60,
        ...request.options,
      }),
    };
  }
);
