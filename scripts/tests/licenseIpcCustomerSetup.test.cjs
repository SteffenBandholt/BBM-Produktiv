const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

function withLicenseIpcModule(fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === 'electron' && String(parent?.filename || '').endsWith('licenseIpc.js')) {
      return {
        app: { isPackaged: false, getVersion: () => '1.0.0' },
        BrowserWindow: { fromWebContents: () => null },
        dialog: {},
        ipcMain: { handle: () => {} },
        shell: { openPath: async () => '' },
      };
    }
    if (request.endsWith('/licenseStorage') || request === '../licensing/licenseStorage') {
      return { saveLicense: () => ({}), loadLicense: () => null, deleteLicense: () => true };
    }
    if (request.endsWith('/deviceIdentity') || request === '../licensing/deviceIdentity') {
      return { getMachineId: () => 'MID-1' };
    }
    if (request.endsWith('/licenseVerifier') || request === '../licensing/licenseVerifier') {
      return { verifyLicense: () => ({ valid: false, reason: 'NO_LICENSE' }) };
    }
    if (request.endsWith('/licenseService') || request === '../licensing/licenseService') {
      return { refreshStatus: () => ({ valid: false, reason: 'NO_LICENSE' }) };
    }
    if (request.endsWith('/licenseAdminService') || request === '../licensing/licenseAdminService') {
      return {
        listCustomers: () => [],
        saveCustomer: (c) => c,
        listLicenses: () => [],
        listLicensesByCustomer: () => [],
        saveLicense: (l) => l,
        listHistory: () => [],
        addHistoryEntry: (e) => e,
      };
    }
    return originalLoad.apply(this, arguments);
  };
  try {
    const modPath = path.join(process.cwd(), 'src/main/ipc/licenseIpc.js');
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
  }
}

async function runLicenseIpcCustomerSetupTests(run) {
  await run('licenseIpc: Kunden-Slug aus Kundennummer + Firmenname wird sicher gebaut', () => {
    withLicenseIpcModule((mod) => {
      const slug = mod._buildCustomerSetupSlug({ customer_number: 'K-100', company_name: 'Musterfirma GmbH' });
      assert.equal(slug, 'K-100-Musterfirma-GmbH');
    });
  });

  await run('licenseIpc: fehlender licenseFilePath blockiert Kunden-Setup-Payload', () => {
    withLicenseIpcModule((mod) => {
      assert.throws(() => mod._validateCustomerSetupPayload({ customer: {}, license: {} }), /LICENSE_FILE_PATH_REQUIRED/);
    });
  });
}

module.exports = {
  runLicenseIpcCustomerSetupTests,
};
