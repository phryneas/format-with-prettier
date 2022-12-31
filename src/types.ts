import { Options } from "prettier";

export interface FormatRequest {
  code: string;
  options: Partial<Options>;
}
export interface FormatResponse {
  formatted: string;
}
