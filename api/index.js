import { createRequestHandler } from "@react-router/node";
import * as build from "../build/server/index.js";

const handler = createRequestHandler(build, process.env.NODE_ENV);

export default async function (req, res) {
  try {
    const request = new Request(
      `https://${req.headers.host}${req.url}`,
      {
        method: req.method,
        headers: req.headers,
        body:
          req.method !== "GET" && req.method !== "HEAD"
            ? await getRawBody(req)
            : undefined,
      }
    );

    const response = await handler(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.end(body);
  } catch (error) {
    console.error("Handler error:", error);
    res.statusCode = 500;
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
