const { createInterface } = require("node:readline/promises");
const { Writable } = require("node:stream");

module.exports = async function localPassword() {
  let password = process.env.CARIBE_LOCAL_ADMIN_PASSWORD;
  if (!password && process.stdin.isTTY) {
    const silent = new Writable({ write(_chunk, _encoding, done) { done(); } });
    const input = createInterface({ input: process.stdin, output: silent, terminal: true });
    process.stderr.write("Contraseña para este administrador local (mínimo 12 caracteres): ");
    try { password = await input.question(""); }
    finally { input.close(); process.stderr.write("\n"); }
  }
  if (!password || password.length < 12) {
    throw new Error("Introduce una contraseña local de al menos 12 caracteres o define CARIBE_LOCAL_ADMIN_PASSWORD.");
  }
  return password;
};
