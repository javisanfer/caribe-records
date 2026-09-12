const test = require("node:test");
const assert = require("node:assert/strict");

const {
  loadRemoteEnvironment,
  parameterToEnvironment,
} = require("../src/config/remote-env.config");

const environmentNames = Object.values(parameterToEnvironment);

test("carga todos los secretos de producción sin registrar sus valores", async (t) => {
  const previous = Object.fromEntries(
    environmentNames.map((name) => [name, process.env[name]]),
  );
  t.after(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  const client = {
    send: async () => ({
      Parameters: Object.keys(parameterToEnvironment).map((name) => ({
        Name: `/caribe-records/production/${name}`,
        Value: `value-for-${name}`,
      })),
    }),
  };

  await loadRemoteEnvironment("/caribe-records/production", client);

  for (const [parameterName, environmentName] of Object.entries(parameterToEnvironment)) {
    assert.equal(process.env[environmentName], `value-for-${parameterName}`);
  }
});

test("detiene el arranque si falta un parámetro requerido", async () => {
  await assert.rejects(
    loadRemoteEnvironment("/caribe-records/production", {
      send: async () => ({ Parameters: [] }),
    }),
    /Missing production parameters/,
  );
});
