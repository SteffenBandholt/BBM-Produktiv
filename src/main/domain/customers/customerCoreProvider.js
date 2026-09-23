"use strict";

const { app } = require("electron");
const { createCustomerCore } = require("../../../customer-core");
const {
  resolveCustomerRuntimeContext,
} = require("./customerRuntimePolicy");

let singleton = null;
let singletonKey = "";

function createCustomerCoreForRuntime({
  userDataPath,
  isPackaged,
  mode,
  env = process.env,
  manufacturerDataPath,
  backupOnOpen = true,
} = {}) {
  const resolvedUserDataPath = String(
    userDataPath || app.getPath("userData") || ""
  ).trim();
  if (!resolvedUserDataPath) throw new Error("customer userData path required");

  const context = resolveCustomerRuntimeContext({
    isPackaged: isPackaged ?? app.isPackaged,
    userDataPath: resolvedUserDataPath,
    mode,
    env,
    manufacturerDataPath,
  });

  const core = createCustomerCore({
    userDataPath: context.rootPath,
    backupOnOpen,
  });

  return {
    ...core,
    context,
  };
}

function getRuntimeCustomerCore(options = {}) {
  const resolvedUserDataPath = String(
    options.userDataPath || app.getPath("userData") || ""
  ).trim();
  if (!resolvedUserDataPath) throw new Error("customer userData path required");

  const context = resolveCustomerRuntimeContext({
    isPackaged: options.isPackaged ?? app.isPackaged,
    userDataPath: resolvedUserDataPath,
    mode: options.mode,
    env: options.env || process.env,
    manufacturerDataPath: options.manufacturerDataPath,
  });

  const key = context.databasePath;
  if (singleton) {
    if (singletonKey !== key) {
      throw new Error("customer runtime context already initialized with a different database");
    }
    return singleton;
  }

  singleton = createCustomerCore({
    userDataPath: context.rootPath,
    backupOnOpen: options.backupOnOpen !== false,
  });
  singleton.context = context;
  singletonKey = key;
  return singleton;
}

function closeRuntimeCustomerCore() {
  if (!singleton) return;
  try {
    singleton.close();
  } finally {
    singleton = null;
    singletonKey = "";
  }
}

// Kompatibilitaetsalias fuer Altaufrufe. Neue Aufrufer verwenden getRuntimeCustomerCore().
const getBbmCustomerCore = getRuntimeCustomerCore;
const closeBbmCustomerCore = closeRuntimeCustomerCore;

module.exports = {
  createCustomerCoreForRuntime,
  getRuntimeCustomerCore,
  closeRuntimeCustomerCore,
  getBbmCustomerCore,
  closeBbmCustomerCore,
};
