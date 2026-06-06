import pkg from "@react-router/node";
const { createRequestHandler } = pkg;
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildPath = path.join(__dirname, "../build/server/index.js");

let requestHandler;

async function getHandler() {
  if (!requestHandler) {
    try {
      const build = await import(buildPath);
      requestHandler = createRequestHandler(build, process.env.NODE_ENV || "production");
    } catch (err) {
      console.error("Failed to load server build:", err);
      throw err;
    }
  }
  return requestHandler;
}

export default async function handler(req, res) {
  try {
    const handle = await getHandler();

    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await getRawBody(req)
        : undefined;

    const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers),
      body,
    });

    const response = await handle(request);

    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    const responseBody = await response.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (error) {
    console.error("Serverless function error:", error.message);
    console.error(error.stack);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error: " + error.message);
  }
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
