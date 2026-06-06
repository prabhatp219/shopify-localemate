import { createRequestListener } from "@react-router/node";
import { createRequestHandler } from "react-router";
import * as buildNamespace from "../build/server/index.js";

// Spread the ES module namespace into a plain object to avoid live-binding issues
// that occur when react-router's createRequestHandler reads the build on each request
const build = { ...buildNamespace };

console.log("[LocaleMate] Plain build keys:", Object.keys(build));
console.log("[LocaleMate] build.routes type:", typeof build.routes);

const handler = createRequestHandler(build, process.env.NODE_ENV || "production");
const listener = createRequestListener(handler);

export default async function serverHandler(req, res) {
  try {
    await listener(req, res);
  } catch (error) {
    console.error("[LocaleMate] Handler error:", error.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error: " + error.message);
  }
}
