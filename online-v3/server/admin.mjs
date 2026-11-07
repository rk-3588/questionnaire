import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSurveyServer } from "./index.mjs";

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const host = process.env.ADMIN_HOST || "127.0.0.1";
  const port = Number(process.env.ADMIN_PORT || 8766);
  if (process.env.NODE_ENV === "production" && !process.env.SURVEY_ADMIN_ORIGIN)
    throw Error("Production admin requires SURVEY_ADMIN_ORIGIN");
  if (
    !["127.0.0.1", "localhost", "::1"].includes(host) &&
    !process.env.SURVEY_ADMIN_ORIGIN
  )
    throw Error("Remote admin requires SURVEY_ADMIN_ORIGIN");
  createSurveyServer({ mode: "admin", host }).listen(port, host, () =>
    console.log(`Research administration ready: http://${host}:${port}/`),
  );
}
