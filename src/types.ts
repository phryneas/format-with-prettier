import { Options } from "prettier";
import { AvailableParser } from "./plugins";

declare module "prettier" {
  export interface Options {
    /**
     * undocumented feature:
     * this would allow someone to specify additional parsers to be loaded without having to have them in a context menu
     * (e.g. if you only want to have one `Markdown` option, but want all the parsers to be loaded)
     */
    extraParsers?: AvailableParser[];
  }
}

export interface FormatRequest {
  code: string;
  options: Partial<Options>;
  unparsedOptions?: string;
}
export interface FormatResponse {
  formatted: string;
  error?: string;
}
