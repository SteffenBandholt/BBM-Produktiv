const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const EventEmitter = require('node:events');
const Module = require('node:module');
const REAL_REPO_ROOT = process.cwd();

function createFakeChild({ exitCode = 0, stdout = '', stderr = '', error = null, stayAlive = false } = {}) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  process.nextTick(() => {
    if (stdout) child.stdout.emit('data', stdout);
    if (stderr) child.stderr.emit('data', stderr);
    if (error) {
      child.emit('error', error);
      return;
    }
    if (stayAlive) return;
    child.emit('close', exitCode);
  });
  return child;
}

function withLicenseIpcModule({ spawnImpl, cwd } = {}, fn) {
  const originalLoad = Module._load;
  const originalCwd = process.cwd();
  if (cwd) process.chdir(cwd);

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
    if (request === 'child_process' && String(parent?.filename || '').endsWith('licenseIpc.js')) {
      return { spawn: spawnImpl || (() => createFakeChild()) };
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
    const modPath = path.join(REAL_REPO_ROOT, 'src/main/ipc/licenseIpc.js');
    delete require.cache[require.resolve(modPath)];
    const mod = require(modPath);
    return fn(mod);
  } finally {
    Module._load = originalLoad;
    if (cwd) process.chdir(originalCwd);
  }
}

async function withTempRepo(setupFn, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bbm-license-ipc-'));
  const repoRoot = path.join(tmp, 'repo');
  fs.mkdirSync(path.join(repoRoot, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'package.json'), '{"name":"x"}', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'scripts', 'dist.cjs'), 'console.log("fake");', 'utf8');
  const licenseFilePath = path.join(repoRoot, 'tmp-license.bbmlic');
  fs.writeFileSync(licenseFilePath, '{}', 'utf8');
  setupFn({ repoRoot, licenseFilePath });
  try {
    return await fn({ repoRoot, licenseFilePath });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function runLicenseIpcCustomerSetupTests(run) {
  await run('licenseIpc: Kunden-Slug aus Kundennummer + Firmenname wird sicher gebaut', () => {
    withLicenseIpcModule({}, (mod) => {
      const slug = mod._buildCustomerSetupSlug({ customer_number: 'K-100', company_name: 'Musterfirma GmbH' });
      assert.equal(slug, 'K-100-Musterfirma-GmbH');
    });
  });

  await run('licenseIpc: fehlender licenseFilePath blockiert Kunden-Setup-Payload', () => {
    withLicenseIpcModule({}, (mod) => {
      assert.throws(() => mod._validateCustomerSetupPayload({ customer: {}, license: {} }), /LICENSE_FILE_PATH_REQUIRED/);
    });
  });

  await run('licenseIpc: resolveNodeExecutableForBuild bevorzugt npm_node_execpath', () => {
    withLicenseIpcModule({}, (mod) => {
      const nodePath = mod.resolveNodeExecutableForBuild({
        env: { npm_node_execpath: '/tmp/node-a', NODE_EXE: '/tmp/node-b' },
        existsSync: (candidate) => candidate === '/tmp/node-a' || candidate === '/tmp/node-b',
        execPath: '/tmp/electron.exe',
        isElectronRuntime: true,
      });
      assert.equal(nodePath, '/tmp/node-a');
    });
  });

  await run('licenseIpc: resolveNodeExecutableForBuild nutzt bei Electron nicht blind process.execPath', () => {
    withLicenseIpcModule({}, (mod) => {
      const nodePath = mod.resolveNodeExecutableForBuild({
        env: {},
        existsSync: () => true,
        execPath: '/tmp/electron.exe',
        isElectronRuntime: true,
      });
      assert.equal(nodePath, 'node');
    });
  });

  await run('licenseIpc: exitCode 0 aber outputDir fehlt -> CUSTOMER_SETUP_ARTIFACT_NOT_FOUND', async () => {
    await withTempRepo(
      () => {},
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ exitCode: 0, stdout: 'ok-log', stderr: 'warn-log' }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild({
              customer: { customer_number: 'K-10', company_name: 'Alpha GmbH' },
              license: { license_binding: 'none' },
              licenseFilePath,
            });
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_ARTIFACT_NOT_FOUND');
            assert.equal(res.customerSlug, 'K-10-Alpha-GmbH');
            assert.equal(res.exitCode, 0);
            assert.equal(res.stdout.includes('ok-log'), true);
            assert.equal(res.stderr.includes('warn-log'), true);
          }
        );
      }
    );
  });

  await run('licenseIpc: outputDir ohne .exe -> CUSTOMER_SETUP_ARTIFACT_NOT_FOUND', async () => {
    await withTempRepo(
      ({ repoRoot }) => {
        fs.mkdirSync(path.join(repoRoot, 'dist', 'customers', 'K-11-Beta-GmbH'), { recursive: true });
        fs.writeFileSync(path.join(repoRoot, 'dist', 'customers', 'K-11-Beta-GmbH', 'readme.txt'), 'x', 'utf8');
      },
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ exitCode: 0 }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild({
              customer: { customer_number: 'K-11', company_name: 'Beta GmbH' },
              license: { license_binding: 'none' },
              licenseFilePath,
            });
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_ARTIFACT_NOT_FOUND');
          }
        );
      }
    );
  });

  await run('licenseIpc: outputDir mit slug-.exe -> ok true + artifactPath', async () => {
    await withTempRepo(
      ({ repoRoot }) => {
        const outDir = path.join(repoRoot, 'dist', 'customers', 'K-12-Gamma-GmbH');
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'BBM-1.5.0-K-12-Gamma-GmbH-Setup.exe'), 'bin', 'utf8');
      },
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ exitCode: 0, stdout: 'builder-start' }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild({
              customer: { customer_number: 'K-12', company_name: 'Gamma GmbH' },
              license: { license_binding: 'none' },
              licenseFilePath,
            });
            assert.equal(res.ok, true);
            assert.equal(res.artifactPath.includes('K-12-Gamma-GmbH'), true);
            assert.equal(res.setupPath.includes('.exe'), true);
            assert.equal(res.stdout.includes('builder-start'), true);
          }
        );
      }
    );
  });

  await run('licenseIpc: Timeout liefert CUSTOMER_SETUP_BUILD_TIMEOUT', async () => {
    await withTempRepo(
      () => {},
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ stayAlive: true }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild(
              {
                customer: { customer_number: 'K-13', company_name: 'Delta GmbH' },
                license: { license_binding: 'none' },
                licenseFilePath,
              },
              { timeoutMs: 5 }
            );
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_BUILD_TIMEOUT');
          }
        );
      }
    );
  });

  await run('licenseIpc: Spawn-Error liefert CUSTOMER_SETUP_BUILD_FAILED', async () => {
    await withTempRepo(
      () => {},
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ error: new Error('spawn kaputt') }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild({
              customer: { customer_number: 'K-14', company_name: 'Epsilon GmbH' },
              license: { license_binding: 'none' },
              licenseFilePath,
            });
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_BUILD_FAILED');
          }
        );
      }
    );
  });
}

module.exports = {
  runLicenseIpcCustomerSetupTests,
};
