import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createAuth, readAuth, passwordValid } from "./auth.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = resolve(process.env.SURVEY_DATA_DIR || resolve(root, "data"));
async function secret(prompt) {
  if (!process.stdin.isTTY)
    throw Error(
      "请在交互终端运行，或运行 npm run start:admin 后在本机 http://127.0.0.1:8766/ 完成首次设置。",
    );
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolveSecret, reject) => {
    let value = "";
    const stop = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          stop();
          reject(Error("已取消"));
          return;
        }
        if (char === "\r" || char === "\n") {
          stop();
          resolveSecret(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        if (char >= " " && value.length < 129) value += char;
      }
    };
    process.stdin.on("data", onData);
  });
}
try {
  if (await readAuth(dataDir))
    throw Error(
      "管理员密码已设置。需要重设时，请先停止服务，由服务器所有者备份并移走 data/admin-auth.json，再运行此命令。",
    );
  const password = await secret("设置管理员密码（12–128字符，输入不显示）：");
  if (!passwordValid(password)) throw Error("密码长度必须为12–128字符。");
  const repeat = await secret("再次输入密码：");
  if (password !== repeat) throw Error("两次密码不同，未保存。");
  await createAuth(dataDir, password);
  console.log("管理员密码已设置。只保存密码校验值，不保存明文。");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
