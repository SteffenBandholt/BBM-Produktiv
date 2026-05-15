const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');

function withPatchedLoad(patchFn, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const replacement = patchFn(request, parent, isMain);
    if (replacement !== undefined) return replacement;
    return originalLoad.apply(this, arguments);
  };
  try {
    return fn();
  } finally {
    Module._load = originalLoad;
  }
}

function loadLicenseVerifierWithStubs({ machineId = 'MID-TEST' } = {}) {
  const modPath = path.join(process.cwd(), 'src/main/licensing/licenseVerifier.js');
  delete require.cache[require.resolve(modPath)];
  return withPatchedLoad((request, parent) => {
    const fromVerifier = String(parent?.filename || '').endsWith(path.join('licensing', 'licenseVerifier.js'));
    if (!fromVerifier) return undefined;
    if (request === 'fs') {
      return {
        existsSync: () => true,
        readFileSync: () => '-----BEGIN PUBLIC KEY-----\nFAKE\n-----END PUBLIC KEY-----',
      };
    }
    if (request === 'crypto') {
      return { verify: () => true };
    }
    if (request === './deviceIdentity') {
      return { getMachineId: () => machineId };
    }
    return undefined;
  }, () => require(modPath));
}

function createValidLicense({
  edition = 'test',
  binding = 'none',
  validUntil = '2030-01-01T00:00:00.000Z',
  trialDurationDays = 30,
  product = 'bbm-protokoll',
  modules = ['protokoll'],
  features = [],
} = {}) {
  const license = {
    schemaVersion: 1,
    product,
    licenseId: 'LIC-TRIAL-1',
    customerName: 'Muster GmbH',
    edition,
    issuedAt: '2026-01-01T00:00:00.000Z',
    validUntil,
    maxDevices: 1,
    modules,
    features,
    binding,
  };
  if (edition === 'test' && binding === 'none') {
    license.trialDurationDays = trialDurationDays;
  }
  return {
    license,
    signature: 'ZmFrZQ==',
  };
}

function withTempUserData(fn) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bbm-trial-storage-'));
  try {
    return fn(tempRoot);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function loadLicenseStorageWithStubs({ userDataPath, machineId = 'MID-TEST' }) {
  const modPath = path.join(process.cwd(), 'src/main/licensing/licenseStorage.js');
  delete require.cache[require.resolve(modPath)];
  return withPatchedLoad((request, parent) => {
    const fromStorage = String(parent?.filename || '').endsWith(path.join('licensing', 'licenseStorage.js'));
    if (!fromStorage) return undefined;
    if (request === 'electron') {
      return {
        app: {
          getPath: () => userDataPath,
          getAppPath: () => process.cwd(),
          isPackaged: false,
        },
      };
    }
    if (request === './deviceIdentity') {
      return { getMachineId: () => machineId };
    }
    return undefined;
  }, () => require(modPath));
}

async function runLicenseTrialRuntimeTests(run) {
  await run('Lizenzpruefung: Testlizenz akzeptiert binding none ohne Machine-ID', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs({ machineId: '' });
    const result = verifyLicense(createValidLicense({ edition: 'test', binding: 'none', trialDurationDays: 30 }));
    assert.equal(result.valid, true);
    assert.equal(result.reason, null);
  });

  await run('Lizenzpruefung: Testablauf wird aus trialStartedAt + trialDurationDays berechnet', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs();
    const now = Date.now();
    const startedAtExpired = new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString();
    const expired = verifyLicense({
      ...createValidLicense({ edition: 'test', binding: 'none', trialDurationDays: 30 }),
      trialStartedAt: startedAtExpired,
    });
    assert.equal(expired.valid, false);
    assert.equal(expired.reason, 'LICENSE_EXPIRED');

    const startedAtFresh = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
    const active = verifyLicense({
      ...createValidLicense({ edition: 'test', binding: 'none', trialDurationDays: 30 }),
      trialStartedAt: startedAtFresh,
    });
    assert.equal(active.valid, true);
    assert.equal(typeof active.daysRemaining, 'number');
    assert.equal(active.daysRemaining > 0, true);
  });

  await run('Lizenzpruefung: Vollversion bleibt bei validUntil-basierter Pruefung', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs({ machineId: 'MID-1' });
    const full = verifyLicense({
      ...createValidLicense({ edition: 'full', binding: 'machine', validUntil: '2099-01-01T00:00:00.000Z' }),
      machineId: 'MID-1',
    });
    assert.equal(full.valid, true);
    assert.equal(full.reason, null);
  });

  await run('Lizenzpruefung: bbm + modules [protokoll] + features [] ist gueltig', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs({ machineId: 'MID-1' });
    const result = verifyLicense(createValidLicense({ product: 'bbm', modules: ['protokoll'], features: [] }));
    assert.equal(result.valid, true);
  });

  await run('Lizenzpruefung: bbm + modules [] + features [] ist gueltig', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs({ machineId: 'MID-1' });
    const result = verifyLicense(createValidLicense({ product: 'bbm', modules: [], features: [] }));
    assert.equal(result.valid, true);
  });

  await run('Lizenzpruefung: legacy product bbm-protokoll bleibt kompatibel', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs({ machineId: 'MID-1' });
    const result = verifyLicense(createValidLicense({ product: 'bbm-protokoll', modules: ['protokoll'], features: [] }));
    assert.equal(result.valid, true);
  });

  await run('Lizenzpruefung: Legacy-Lizenz ohne modules-Feld bleibt gueltig', () => {
    const { verifyLicense } = loadLicenseVerifierWithStubs({ machineId: 'MID-1' });
    const payload = createValidLicense({ product: 'bbm-protokoll', features: ['protokoll'] });
    delete payload.license.modules;
    const result = verifyLicense(payload);
    assert.equal(result.valid, true);
  });

  await run('licenseStorage: setzt trialStartedAt beim ersten Speichern einer Testlizenz', () => {
    withTempUserData((userDataPath) => {
      const storage = loadLicenseStorageWithStubs({ userDataPath, machineId: 'MID-A' });
      const saved = storage.saveLicense(createValidLicense({ edition: 'test', binding: 'none', trialDurationDays: 30 }));
      assert.equal(typeof saved.trialStartedAt, 'string');
      assert.equal(saved.trialStartedAt.length > 10, true);
    });
  });

  await run('licenseStorage: ueberschreibt vorhandenes trialStartedAt nicht', () => {
    withTempUserData((userDataPath) => {
      const storage = loadLicenseStorageWithStubs({ userDataPath, machineId: 'MID-A' });
      const first = storage.saveLicense(createValidLicense({ edition: 'test', binding: 'none', trialDurationDays: 30 }));
      const second = storage.saveLicense(createValidLicense({ edition: 'test', binding: 'none', trialDurationDays: 30 }));
      assert.equal(second.trialStartedAt, first.trialStartedAt);
    });
  });
}

module.exports = { runLicenseTrialRuntimeTests };
