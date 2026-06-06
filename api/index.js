import { createRequestListener } from "@react-router/node";
import { createRequestHandler } from "react-router";
import * as build from "../build/server/index.js";

const handler = createRequestHandler(build, process.env.NODE_ENV || "production");
const listener = createRequestListener(handler);

export default async function serverHandler(req, res) {
  try {
    await listener(req, res);
  } catch (error) {
    console.error("[LocaleMate] Handler error:", error.message);
    console.error(error.stack);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error: " + error.message);
  }
}
