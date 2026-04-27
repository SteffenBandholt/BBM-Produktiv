const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');

function withMockedLicenseStorage({ userDataSetup, resourcesSetup }, fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bbm-license-storage-'));
  const userDataPath = path.join(tmpRoot, 'userData');
  const appPath = path.join(tmpRoot, 'app');
  const resourcesPath = path.join(appPath, 'resources');
  fs.mkdirSync(userDataPath, { recursive: true });
  fs.mkdirSync(path.join(resourcesPath, 'license'), { recursive: true });
  fs.mkdirSync(appPath, { recursive: true });

  if (typeof userDataSetup === 'function') userDataSetup({ userDataPath, resourcesPath, appPath });
  if (typeof resourcesSetup === 'function') resourcesSetup({ userDataPath, resourcesPath, appPath });

  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === 'electron' && String(parent?.filename || '').endsWith('licenseStorage.js')) {
      return {
        app: {
          isPackaged: true,
          getPath: (name) => (name === 'userData' ? userDataPath : ''),
          getAppPath: () => appPath,
        },
      };
    }
    if (request === './deviceIdentity' && String(parent?.filename || '').endsWith('licenseStorage.js')) {
      return { getMachineId: () => 'MACHINE-TEST-1' };
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const modPath = path.join(process.cwd(), 'src/main/licensing/licenseStorage.js');
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn({ mod, userDataPath, resourcesPath });
  } finally {
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function runLicenseStorageBootstrapTests(run) {
  await run('Lizenz-Bootstrap: bundled license/customer.bbmlic wird genutzt, wenn userData/license.json fehlt', () => {
    withMockedLicenseStorage(
      {
        resourcesSetup: ({ resourcesPath }) => {
          const bundledPath = path.join(resourcesPath, 'license', 'customer.bbmlic');
          fs.writeFileSync(
            bundledPath,
            JSON.stringify({ license: { product: 'bbm-protokoll' }, signature: 'abc' }),
            'utf8'
          );
        },
      },
      ({ mod, userDataPath }) => {
        const loaded = mod.loadLicense();
        assert.equal(Boolean(loaded), true);
        assert.equal(loaded.license.product, 'bbm-protokoll');
        assert.equal(fs.existsSync(path.join(userDataPath, 'license.json')), true);
      }
    );
  });

  await run('Lizenz-Bootstrap: userData/license.json hat Vorrang vor gebuendelter Lizenz', () => {
    withMockedLicenseStorage(
      {
        userDataSetup: ({ userDataPath }) => {
          fs.writeFileSync(
            path.join(userDataPath, 'license.json'),
            JSON.stringify({ license: { product: 'bbm-protokoll', source: 'userData' }, signature: 'u' }),
            'utf8'
          );
        },
        resourcesSetup: ({ resourcesPath }) => {
          fs.writeFileSync(
            path.join(resourcesPath, 'license', 'customer.bbmlic'),
            JSON.stringify({ license: { product: 'bbm-protokoll', source: 'bundled' }, signature: 'b' }),
            'utf8'
          );
        },
      },
      ({ mod }) => {
        const loaded = mod.loadLicense();
        assert.equal(loaded.license.source, 'userData');
      }
    );
  });

  await run('Lizenz-Bootstrap: ungueltige bundled license fuehrt zu null (NO_LICENSE/INVALID_FORMAT via Verifier)', () => {
    withMockedLicenseStorage(
      {
        resourcesSetup: ({ resourcesPath }) => {
          fs.writeFileSync(path.join(resourcesPath, 'license', 'customer.bbmlic'), 'not-json', 'utf8');
        },
      },
      ({ mod, userDataPath }) => {
        const loaded = mod.loadLicense();
        assert.equal(loaded, null);
        assert.equal(fs.existsSync(path.join(userDataPath, 'license.json')), false);
      }
    );
  });
}

module.exports = {
  runLicenseStorageBootstrapTests,
};
