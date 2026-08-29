"use strict";

const assert = require("assert");

const {
  FIRM_USAGE_CODES,
} = require("../../src/main/db/firmUsagesRepo");
const {
  LICENSE_MODULES,
  LICENSE_FEATURES,
  normalizeLicensedModules,
  normalizeLicensedFeatures,
} = require("../../src/main/licensing/licenseFeatures");
const {
  getProductAdapter,
  listProductAdapters,
} = require("../../src/main/licensing/licenseIssuerService");

function run() {
  assert.strictEqual(
    FIRM_USAGE_CODES.LICENSE_CUSTOMER,
    "license_customer",
    "Lizenzkunden müssen eine eigene zentrale Firmenverwendung besitzen."
  );

  assert.deepStrictEqual(
    normalizeLicensedModules(["protokoll", "restarbeiten", "rechnung"]),
    [LICENSE_MODULES.PROTOKOLL, LICENSE_MODULES.RESTARBEITEN, LICENSE_MODULES.RECHNUNG]
  );

  assert.deepStrictEqual(
    normalizeLicensedFeatures(["audio", "license_admin"]),
    [LICENSE_FEATURES.DIKTAT, LICENSE_FEATURES.LICENSE_ADMIN]
  );

  const bbm = getProductAdapter("bbm");
  assert.ok(bbm, "BBM-Produktadapter fehlt.");
  assert.strictEqual(bbm.product, "bbm");
  assert.strictEqual(bbm.extension, "bbmlic");
  assert.ok(bbm.moduleIds.includes("rechnung"));
  assert.ok(bbm.featureIds.includes("license_admin"));

  assert.ok(
    listProductAdapters().some((adapter) => adapter.product === "bbm"),
    "BBM muss als erster Adapter registriert sein."
  );

  console.log("licenseAdminModernization.test.cjs: OK");
}

run();
