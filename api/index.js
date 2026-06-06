import { createRequestListener } from "@react-router/node";
import { createRequestHandler } from "react-router";
import * as build from "../build/server/index.js";

// Debug: log what the build object contains at startup
console.log("[LocaleMate] Build keys:", Object.keys(build));
console.log("[LocaleMate] build.routes type:", typeof build.routes);
console.log("[LocaleMate] build.assets type:", typeof build.assets);
console.log("[LocaleMate] build.entry type:", typeof build.entry);

let handler;
let listener;

try {
  handler = createRequestHandler(build, process.env.NODE_ENV || "production");
  listener = createRequestListener(handler);
  console.log("[LocaleMate] Handler created successfully");
} catch (err) {
  console.error("[LocaleMate] Failed to create handler:", err.message);
}

export default async function serverHandler(req, res) {
  if (!listener) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Server failed to initialize. Check logs.");
    return;
  }
  try {
    await listener(req, res);
  } catch (error) {
    console.error("[LocaleMate] Handler error:", error.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error: " + error.message);
  }
}
