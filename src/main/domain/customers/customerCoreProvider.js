"use strict";

const { app } = require("electron");
const { createCustomerCore } = require("../../../customer-core");

let singleton = null;

function getBbmCustomerCore({ userDataPath } = {}) {
  if (singleton) return singleton;
  const resolvedUserDataPath = String(userDataPath || app.getPath("userData") || "").trim();
  if (!resolvedUserDataPath) throw new Error("customer userData path required");
  singleton = createCustomerCore({
    userDataPath: resolvedUserDataPath,
    backupOnOpen: true,
  });
  return singleton;
}

function closeBbmCustomerCore() {
  if (!singleton) return;
  try {
    singleton.close();
  } finally {
    singleton = null;
  }
}

module.exports = { getBbmCustomerCore, closeBbmCustomerCore };
