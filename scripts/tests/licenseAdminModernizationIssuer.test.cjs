"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

function run() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "src", "main", "licensing", "licenseIssuerService.js"),
    "utf8"
  );

  assert.ok(source.includes('product: "bbm"'), "BBM-Adapter fehlt.");
  assert.ok(source.includes('extension: "bbmlic"'), "BBM-Lizenzextension fehlt.");
  assert.ok(source.includes("registerProductAdapter"), "Produktadapter-Registry fehlt.");
  assert.ok(source.includes("crypto.sign"), "Signierung fehlt.");
  assert.ok(source.includes("BBM_LICENSE_PRIVATE_KEY_PATH"), "Externer Schlüsselpfad fehlt.");
  assert.ok(!source.includes("keys/private_key.pem"), "Repo-internen privaten Schlüsselpfad nicht wieder einführen.");

  console.log("licenseAdminModernizationIssuer.test.cjs: OK");
}

run();
