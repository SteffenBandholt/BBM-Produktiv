const assert = require('node:assert/strict');
const path = require('node:path');

const { buildCustomerProfileId, buildCustomerDistConfig, buildMachineSetupMetaFromEnv } = require('../../scripts/dist.cjs');

async function runDistCustomerBuildTests(run) {
  await run('dist.cjs: ohne BBM_CUSTOMER_LICENSE_FILE bleibt Build unveraendert', () => {
    const baseBuild = {
      directories: { output: 'dist' },
      extraResources: [{ from: 'a', to: 'b' }],
      nsis: { artifactName: 'Default-${version}.exe' },
      npmRebuild: true,
      buildDependenciesFromSource: true,
    };
    const out = buildCustomerDistConfig({ baseBuild, baseVersion: '1.2.3', customerLicenseFile: '' });
    assert.equal(out.outputDir, 'dist');
    assert.equal(out.artifactName, null);
    assert.deepEqual(out.build.directories, { output: 'dist' });
    assert.equal(out.build.extraResources.length, 1);
    assert.equal(out.build.nsis.artifactName, 'Default-${version}.exe');
    assert.equal(out.build.npmRebuild, true);
    assert.equal(out.build.buildDependenciesFromSource, true);
  });

  await run('dist.cjs: mit BBM_CUSTOMER_LICENSE_FILE wird extraResource und Kundenziel gesetzt', () => {
    const out = buildCustomerDistConfig({
      baseBuild: {
        directories: { output: 'dist' },
        extraResources: [{ from: 'dev/models', to: 'audio/models' }],
        nsis: {},
      },
      baseVersion: '2.0.0',
      customerLicenseFile: path.join('C:', 'tmp', 'customer.bbmlic'),
      customerSlug: 'K-100-Musterfirma-GmbH',
      customerProfileKey: 'K-100',
    });

    assert.equal(out.outputDir, path.join('dist', 'customers', 'K-100-Musterfirma-GmbH'));
    assert.equal(out.artifactName, 'BBM-2.0.0-K-100-Musterfirma-GmbH-Setup.exe');
    const embedded = out.build.extraResources.find((entry) => entry.to === 'license/customer.bbmlic');
    assert.equal(Boolean(embedded), true);
    assert.equal(embedded.from.endsWith('customer.bbmlic'), true);
    assert.equal(out.build.directories.output, path.join('dist', 'customers', 'K-100-Musterfirma-GmbH'));
    assert.equal(out.build.nsis.artifactName, 'BBM-2.0.0-K-100-Musterfirma-GmbH-Setup.exe');
    assert.deepEqual(out.build.asar, { smartUnpack: false });
    assert.equal(out.build.npmRebuild, false);
    assert.equal(out.build.buildDependenciesFromSource, false);
    assert.equal(out.build.extraMetadata.distributionId, 'customer');
    assert.equal(out.build.extraMetadata.customerProfileId, buildCustomerProfileId('K-100'));
    assert.equal(out.appId, `de.bbm.baubesprechungsmanager.customer.${buildCustomerProfileId('K-100')}`);
  });

  await run('dist.cjs: expliziter Paketordner verhindert Überschreiben früherer Kundenergebnisse', () => {
    const uniqueOutput = path.join('C:', 'packages', 'Kunde__LIC-1__v2.0.0__20260917-120000Z', 'Weitergabe-an-Lizenznehmer');
    const out = buildCustomerDistConfig({
      baseBuild: { directories: { output: 'dist' }, extraResources: [], nsis: {} },
      baseVersion: '2.0.0',
      customerLicenseFile: path.join('C:', 'packages', 'license.bbmlic'),
      customerSlug: 'Kunde',
      customerOutputDir: uniqueOutput,
      customerProfileKey: 'K-100',
    });
    assert.equal(out.outputDir, uniqueOutput);
    assert.equal(out.build.directories.output, uniqueOutput);
    assert.equal(out.artifactName, 'BBM-2.0.0-Kunde-Setup.exe');
  });

  await run('dist.cjs: Machine-Setup ohne Lizenzdatei nutzt Kundenziel ohne customer.bbmlic', () => {
    const out = buildCustomerDistConfig({
      baseBuild: {
        directories: { output: 'dist' },
        extraResources: [{ from: 'dev/models', to: 'audio/models' }],
        nsis: {},
      },
      baseVersion: '2.0.0',
      customerLicenseFile: '',
      customerSetupFile: path.join('C:', 'tmp', 'customer-setup.json'),
      customerSlug: 'K-100-Musterfirma-GmbH',
      customerSetupType: 'machine',
      customerProfileKey: 'K-100',
    });

    assert.equal(out.outputDir, path.join('dist', 'customers', 'K-100-Musterfirma-GmbH'));
    assert.equal(out.artifactName, 'BBM-2.0.0-K-100-Musterfirma-GmbH-Setup.exe');
    const embedded = out.build.extraResources.find((entry) => entry.to === 'license/customer.bbmlic');
    const setupMeta = out.build.extraResources.find((entry) => entry.to === 'license/customer-setup.json');
    assert.equal(Boolean(embedded), false);
    assert.equal(Boolean(setupMeta), true);
    assert.equal(setupMeta.from.endsWith('customer-setup.json'), true);
    assert.equal(out.build.directories.output, path.join('dist', 'customers', 'K-100-Musterfirma-GmbH'));
    assert.equal(out.build.nsis.artifactName, 'BBM-2.0.0-K-100-Musterfirma-GmbH-Setup.exe');
    assert.equal(out.build.npmRebuild, false);
    assert.equal(out.build.buildDependenciesFromSource, false);
  });

  await run('dist.cjs: Kundenbuild behaelt explizites ASAR-Unpack und deaktiviert nur Smart-Unpack', () => {
    const out = buildCustomerDistConfig({
      baseBuild: {
        asar: { ordering: 'asar-order.txt', smartUnpack: true },
        asarUnpack: ['node_modules/better-sqlite3/**'],
        extraResources: [],
        nsis: {},
      },
      customerLicenseFile: path.join('C:', 'tmp', 'customer.bbmlic'),
      customerProfileKey: 'K-100',
    });
    assert.deepEqual(out.build.asar, { ordering: 'asar-order.txt', smartUnpack: false });
    assert.deepEqual(out.build.asarUnpack, ['node_modules/better-sqlite3/**']);
  });

  await run('dist.cjs: Kundenprofil ist stabil, getrennt und entfernt interne Ressourcen', () => {
    assert.equal(buildCustomerProfileId(' K-100 '), buildCustomerProfileId('k-100'));
    assert.notEqual(buildCustomerProfileId('K-100'), buildCustomerProfileId('K-200'));
    const out = buildCustomerDistConfig({
      baseBuild: {
        extraResources: [
          { from: 'build/ui-editor-manager', to: 'ui-editor' },
          { from: 'dev/internal/developmentLicenseProvider.cjs', to: 'internal-development-license/provider.cjs' },
          { from: 'old.bbmlic', to: 'license/customer.bbmlic' },
          { from: 'audio', to: 'audio/whisper' },
        ],
        nsis: {},
      },
      customerLicenseFile: path.join('C:', 'tmp', 'new.bbmlic'),
      customerProfileKey: 'K-100',
    });
    assert.deepEqual(out.build.extraResources.map((entry) => entry.to), ['audio/whisper', 'license/customer.bbmlic']);
    assert.equal(out.build.nsis.deleteAppDataOnUninstall, false);
    assert.throws(
      () => buildCustomerDistConfig({ baseBuild: {}, customerLicenseFile: 'customer.bbmlic' }),
      (error) => error?.code === 'CUSTOMER_PROFILE_KEY_REQUIRED'
    );
  });

  await run('dist.cjs: Machine-Setup-Metadaten enthalten Kundennummer, Lizenz-ID, Produkt und Binding', () => {
    const meta = buildMachineSetupMetaFromEnv({
      BBM_CUSTOMER_SLUG: 'K-100-Musterfirma-GmbH',
      BBM_CUSTOMER_NAME: 'Musterfirma GmbH',
      BBM_CUSTOMER_NUMBER: 'K-100',
      BBM_LICENSE_ID: 'LIC-100',
    });
    assert.equal(meta.schemaVersion, 1);
    assert.equal(meta.setupType, 'machine');
    assert.equal(meta.product, 'bbm-protokoll');
    assert.equal(meta.expectedBinding, 'machine');
    assert.equal(meta.customerName, 'Musterfirma GmbH');
    assert.equal(meta.customerNumber, 'K-100');
    assert.equal(meta.licenseId, 'LIC-100');
    assert.equal(meta.customerSlug, 'K-100-Musterfirma-GmbH');
    assert.equal(typeof meta.createdAt, 'string');
    assert.equal(meta.createdAt.length > 10, true);
  });
}

module.exports = {
  runDistCustomerBuildTests,
};
