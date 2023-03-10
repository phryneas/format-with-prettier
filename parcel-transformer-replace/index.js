exports.default = new (require("@parcel/plugin").Transformer)({
  async transform({ asset }) {
    if (asset.filePath.includes("node_modules")) {
      // remove an eval for `globalThis` from some dependencies - those would trigger the DANGEROUS_EVAL web-ext lint rule
      asset.setCode((await asset.getCode()).replace(/Function\(['"]return this['"]\)\(\)/, "globalThis"));
    }

    return [asset];
  },
});
