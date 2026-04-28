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

  await run('licenseIpc: Machine-Setup erlaubt fehlende Lizenzdatei und fehlende Machine-ID', () => {
    withLicenseIpcModule({}, (mod) => {
      const payload = mod._validateCustomerSetupPayload({
        customer: { customer_number: 'K-200', company_name: 'Maschine GmbH' },
        license: { license_binding: 'machine', machine_id: '' },
        setupType: 'machine',
      });
      assert.equal(payload.setupType, 'machine');
      assert.equal(payload.licenseFilePath, '');
      assert.equal(payload.customerSlug, 'K-200-Maschine-GmbH');
    });
  });

  await run('licenseIpc: resolveNodeExecutableForBuild bevorzugt npm_node_execpath', () => {
    withLicenseIpcModule({}, (mod) => {
      const resolved = mod.resolveNodeExecutableForBuild({
        env: { npm_node_execpath: '/tmp/node-a', NODE_EXE: '/tmp/node-b' },
        existsSync: (candidate) => candidate === '/tmp/node-a' || candidate === '/tmp/node-b',
        execPath: '/tmp/electron.exe',
        isElectronRuntime: true,
        spawnSyncImpl: () => ({ status: 0 }),
      });
      assert.equal(resolved.ok, true);
      assert.equal(resolved.nodeExecutable, '/tmp/node-a');
    });
  });

  await run('licenseIpc: resolveNodeExecutableForBuild nutzt bei Electron nicht blind process.execPath', () => {
    withLicenseIpcModule({}, (mod) => {
      const resolved = mod.resolveNodeExecutableForBuild({
        env: {},
        existsSync: () => false,
        execPath: '/tmp/electron.exe',
        isElectronRuntime: true,
        spawnSyncImpl: () => ({ status: 1 }),
      });
      assert.equal(resolved.ok, false);
      assert.equal(resolved.error, 'NODE_EXECUTABLE_NOT_FOUND');
    });
  });

  await run('licenseIpc: Testlizenz-Payload verlangt trialDurationDays statt validUntil', () => {
    withLicenseIpcModule({}, (mod) => {
      const parsed = mod._validateGenerationPayload({
        customerName: 'Testkunde',
        licenseId: 'LIC-T-1',
        edition: 'test',
        binding: 'none',
        validFrom: '2026-06-01',
        trialDurationDays: 30,
        maxDevices: 1,
        features: ['app'],
      });
      assert.equal(parsed.validUntil, '');
      assert.equal(parsed.trialDurationDays, 30);
    });
  });

  await run('licenseIpc: Testlizenz ohne trialDurationDays wird abgewiesen', () => {
    withLicenseIpcModule({}, (mod) => {
      assert.throws(
        () => mod._validateGenerationPayload({
          customerName: 'Testkunde',
          licenseId: 'LIC-T-2',
          edition: 'test',
          binding: 'none',
          validFrom: '2026-06-01',
          maxDevices: 1,
          features: ['app'],
        }),
        /TRIAL_DURATION_DAYS_REQUIRED/
      );
    });
  });

  await run('licenseIpc: Vollversion ohne validUntil wird weiterhin abgewiesen', () => {
    withLicenseIpcModule({}, (mod) => {
      assert.throws(
        () =>
          mod._validateGenerationPayload({
            customerName: 'Vollkunde',
            licenseId: 'LIC-F-1',
            edition: 'full',
            binding: 'machine',
            validFrom: '2026-06-01',
            maxDevices: 1,
            features: ['app'],
            machineId: 'MID-F-1',
          }),
        /VALID_UNTIL_REQUIRED/
      );
    });
  });

  await run('licenseIpc: kein validFrom+Testdauer-Fallback auf validUntil mehr vorhanden', () => {
    const source = fs.readFileSync(path.join(REAL_REPO_ROOT, 'src/main/ipc/licenseIpc.js'), 'utf8');
    assert.equal(source.includes('_computeValidUntil'), false);
    assert.equal(
      source.includes('inputData.edition === "test" && inputData.binding === "none" ? {} : { validUntil: inputData.validUntil }'),
      true
    );
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
            }, {
              nodeResolver: () => ({ ok: true, nodeExecutable: 'node', trace: ['test'] }),
            });
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_ARTIFACT_NOT_FOUND');
            assert.equal(res.customerSlug, 'K-10-Alpha-GmbH');
            assert.equal(res.exitCode, 0);
            assert.equal(res.stdout.includes('ok-log'), true);
            assert.equal(res.stderr.includes('warn-log'), true);
            assert.equal(typeof res.logPath, 'string');
            assert.equal(fs.existsSync(res.logPath), true);
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
            }, {
              nodeResolver: () => ({ ok: true, nodeExecutable: 'node', trace: ['test'] }),
            });
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_ARTIFACT_NOT_FOUND');
            assert.equal(fs.existsSync(res.logPath), true);
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
            }, {
              nodeResolver: () => ({ ok: true, nodeExecutable: 'node', trace: ['test'] }),
            });
            assert.equal(res.ok, true);
            assert.equal(res.artifactPath.includes('K-12-Gamma-GmbH'), true);
            assert.equal(res.setupPath.includes('.exe'), true);
            assert.equal(res.stdout.includes('builder-start'), true);
            assert.equal(fs.existsSync(res.logPath), true);
            assert.equal(res.cwd, repoRoot);
            assert.equal(res.env.BBM_CUSTOMER_LICENSE_FILE, licenseFilePath);
            assert.equal(res.env.BBM_CUSTOMER_SETUP_TYPE, 'test');
            assert.equal(res.env.BBM_CUSTOMER_SLUG, 'K-12-Gamma-GmbH');
            assert.equal(res.env.BBM_CUSTOMER_NAME, 'Gamma GmbH');
          }
        );
      }
    );
  });

  await run('licenseIpc: Machine-Setup setzt keinen BBM_CUSTOMER_LICENSE_FILE Env-Wert', async () => {
    await withTempRepo(
      ({ repoRoot }) => {
        const outDir = path.join(repoRoot, 'dist', 'customers', 'K-18-Machine-GmbH');
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'BBM-1.5.0-K-18-Machine-GmbH-Setup.exe'), 'bin', 'utf8');
      },
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ exitCode: 0 }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild({
              customer: { customer_number: 'K-18', company_name: 'Machine GmbH' },
              license: { license_binding: 'machine', machine_id: '' },
              setupType: 'machine',
              licenseFilePath,
            }, {
              nodeResolver: () => ({ ok: true, nodeExecutable: 'node', trace: ['test'] }),
            });
            assert.equal(res.ok, true);
            assert.equal(res.env.BBM_CUSTOMER_SETUP_TYPE, 'machine');
            assert.equal(Boolean(res.env.BBM_CUSTOMER_LICENSE_FILE), false);
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
              {
                timeoutMs: 5,
                nodeResolver: () => ({ ok: true, nodeExecutable: 'node', trace: ['test'] }),
              }
            );
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_BUILD_TIMEOUT');
            assert.equal(fs.existsSync(res.logPath), true);
          }
        );
      }
    );
  });

  await run('licenseIpc: fehlender Node liefert NODE_EXECUTABLE_NOT_FOUND', async () => {
    await withTempRepo(
      () => {},
      async ({ repoRoot, licenseFilePath }) => {
        await withLicenseIpcModule(
          { cwd: repoRoot, spawnImpl: () => createFakeChild({ stayAlive: true }) },
          async (mod) => {
            const res = await mod._runCustomerSetupBuild(
              {
                customer: { customer_number: 'K-15', company_name: 'Zeta GmbH' },
                license: { license_binding: 'none' },
                licenseFilePath,
              },
              {
                nodeResolver: () => ({ ok: false, error: 'NODE_EXECUTABLE_NOT_FOUND', nodeExecutable: '', trace: [] }),
              }
            );
            assert.equal(res.ok, false);
            assert.equal(res.error, 'NODE_EXECUTABLE_NOT_FOUND');
            assert.equal(fs.existsSync(res.logPath), true);
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
            }, {
              nodeResolver: () => ({ ok: true, nodeExecutable: 'node', trace: ['test'] }),
            });
            assert.equal(res.ok, false);
            assert.equal(res.error, 'CUSTOMER_SETUP_BUILD_FAILED');
            assert.equal(fs.existsSync(res.logPath), true);
          }
        );
      }
    );
  });
}

module.exports = {
  runLicenseIpcCustomerSetupTests,
};
