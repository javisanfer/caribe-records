const test = require("node:test");
const assert = require("node:assert/strict");

const { assertSafeTestTarget, databaseName } = require("../scripts/reset-test-database");

test("acepta una base de QA separada y terminada en _test", () => {
  assert.deepEqual(
    assertSafeTestTarget(
      "mongodb://127.0.0.1:27017/caribe_records",
      "mongodb://127.0.0.1:27017/caribe_records_test",
    ),
    { sourceName: "caribe_records", targetName: "caribe_records_test" },
  );
});

test("rechaza una base de destino sin el sufijo _test", () => {
  assert.throws(
    () => assertSafeTestTarget(
      "mongodb://127.0.0.1:27017/caribe_records",
      "mongodb://127.0.0.1:27017/caribe_records_qa",
    ),
    /debe terminar en _test/,
  );
});

test("rechaza usar la misma base como origen y destino", () => {
  assert.throws(
    () => assertSafeTestTarget(
      "mongodb://127.0.0.1:27017/caribe_records_test",
      "mongodb://127.0.0.1:27017/caribe_records_test",
    ),
    /distinta del origen/,
  );
});

test("rechaza una URI sin nombre de base", () => {
  assert.throws(
    () => databaseName("mongodb://127.0.0.1:27017"),
    /debe incluir el nombre/,
  );
});
