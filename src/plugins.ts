import { BuiltInParserName, Plugin as PrettierPlugin } from "prettier";

export interface PluginDescription {
  plugin: () => Promise<PrettierPlugin>;
  name: string;
  types: Partial<Record<BuiltInParserName, string>>;
}

export const plugins = [
  {
    plugin: () => import("prettier/parser-babel"),
    name: "Babel",
    types: {
      babel: "JavaScript",
      "babel-ts": "TypeScript",
      "babel-flow": "Flow",
      json: "JSON",
      json5: "JSON5",
      "json-stringify": "json-stringify",
    },
  },
  {
    plugin: () => import("prettier/parser-html"),
    name: "HTML",
    types: { html: "HTML", vue: "Vue" },
  },
  {
    plugin: () => import("prettier/parser-graphql"),
    name: "GraphQL",
    types: { graphql: "GraphQL" },
  },
  {
    plugin: () => import("prettier/parser-markdown"),
    name: "Markdown",
    types: {
      markdown: "Markdown",
      mdx: "MDX",
    },
  },
  {
    plugin: () => import("prettier/parser-postcss"),
    name: "PostCSS",
    types: {
      css: "CSS",
      less: "Less",
      scss: "Sass",
    },
  },
  {
    plugin: () => import("prettier/parser-typescript"),
    name: "TypeScript",
    types: { typescript: "TypeScript" },
  },
  {
    plugin: () => import("prettier/parser-yaml"),
    name: "YAML",
    types: { yaml: "YAML" },
  },
  // other plugins currently not included:
  // acorn: "JavaScript (Acorn)",
  // angular: "Angular",
  // espree: "JavaScript (Espree)",
  // flow: "Flow",
  // glimmer: "Handlebars",
  // lwc: "HTML (Lwc)",
  // meriyah: "JavaScript (Meriyah)",
] as const satisfies readonly PluginDescription[];

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type PluginDefs = typeof plugins;
export type AvailableParser = keyof UnionToIntersection<PluginDefs[number]["types"]>;

export const parsersByName = Object.fromEntries(
  plugins.flatMap(({ name, plugin, types }) =>
    Object.entries(types).map(
      ([parser, description]) =>
        [
          parser,
          {
            pluginName: name,
            plugin,
            parser: parser as AvailableParser,
            description,
          },
        ] as const
    )
  )
);

export function getEnabledParsersWithName(enabledParsers: AvailableParser[]) {
  return Object.values(parsersByName).filter((p) => enabledParsers.includes(p.parser));
}

export async function getEnabledPluginsByParserName(enabledParsers: AvailableParser[]): Promise<PrettierPlugin[]> {
  const pluginLoaders = new Set<() => Promise<PrettierPlugin>>();
  for (const parser of enabledParsers) {
    pluginLoaders.add(parsersByName[parser].plugin);
  }
  return Promise.all([...pluginLoaders.values()].map((fn) => fn()));
}
