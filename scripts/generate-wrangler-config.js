import { readFileSync, writeFileSync } from "node:fs";

const contents = readFileSync("wrangler.toml.example", "utf8").replaceAll(
  "YYYY-MM-DD",
  "2025-12-04",
);

writeFileSync("wrangler.toml", contents);
