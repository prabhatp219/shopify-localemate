import {
  createRequestHandler,
  createRequestListener,
} from "@react-router/node";

import * as buildNamespace from "../build/server/index.js";

// Convert ESM namespace to plain object
const build = { ...buildNamespace };

console.log("[LocaleMate] Build keys:", Object.keys(build));
console.log("[LocaleMate] BUILD EXISTS:", !!build);
console.log("[LocaleMate] ROUTES EXISTS:", !!build.routes);
console.log(
  "[LocaleMate] ROUTE COUNT:",
  Object.keys(build.routes || {}).length
);
console.log(
  "[LocaleMate] ROUTE IDS:",
  Object.keys(build.routes || {})
);

const handler = createRequestHandler(build);
const listener = createRequestListener(handler);

export default async function serverHandler(req, res) {
  try {
    await listener(req, res);
  } catch (error) {
    console.error("[LocaleMate] Handler error:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end(
      "Internal Server Error: " +
        (error?.message || "Unknown error")
    );
  }
}