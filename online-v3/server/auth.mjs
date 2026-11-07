import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const scrypt = promisify(scryptCallback);
export const passwordValid = (value) =>
  typeof value === "string" && value.length >= 12 && value.length <= 128;
export async function readAuth(dataDir) {
  try {
    const value = JSON.parse(
      await readFile(join(dataDir, "admin-auth.json"), "utf8"),
    );
    if (
      value.version !== 1 ||
      !/^[a-f0-9]{32}$/.test(value.salt) ||
      !/^[a-f0-9]{128}$/.test(value.hash)
    )
      throw Error("invalid_auth_configuration");
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
export async function createAuth(dataDir, password) {
  if (!passwordValid(password))
    throw Object.assign(Error("password_length"), { status: 400 });
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  try {
    await writeFile(
      join(dataDir, "admin-auth.json"),
      JSON.stringify({ version: 1, salt, hash }),
      { flag: "wx", mode: 0o600 },
    );
  } catch (error) {
    if (error.code === "EEXIST")
      throw Object.assign(Error("already_configured"), { status: 409 });
    throw error;
  }
}
export async function verifyPassword(password, auth) {
  if (!passwordValid(password) || !auth) return false;
  const actual = await scrypt(password, auth.salt, 64);
  return timingSafeEqual(actual, Buffer.from(auth.hash, "hex"));
}
