"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "..", relativePath), "utf8");
}

function run() {
  const accessState = read("src/renderer/app/modules/moduleAccessState.js");
  const catalog = read("src/renderer/app/modules/moduleCatalog.js");
  const screen = read("src/renderer/modules/lizenzverwaltung/screens/LicenseAdminScreenV3.js");
  const issuer = read("src/main/licensing/licenseIssuerService.js");

  assert.ok(accessState.includes('const LICENSE_ADMIN_FEATURE = "license_admin"'));
  assert.ok(accessState.includes("LIZENZVERWALTUNG_MODULE_ID"));
  assert.ok(catalog.includes("getLizenzverwaltungModuleEntry"));
  assert.ok(screen.includes("if (!this.isDevelopment"));
  assert.ok(screen.includes('this.featureInputs.set("license_admin", checkbox)'));
  assert.ok(issuer.includes("BBM_LICENSE_PRIVATE_KEY_PATH"));
  assert.ok(!issuer.includes("keys/private_key.pem"));

  console.log("licenseAdminModernizationStatic.test.cjs: OK");
}

run();
