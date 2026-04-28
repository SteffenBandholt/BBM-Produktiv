const assert = require('node:assert/strict');
const path = require('node:path');

const { buildCustomerDistConfig } = require('../../scripts/dist.cjs');

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
    });

    assert.equal(out.outputDir, path.join('dist', 'customers', 'K-100-Musterfirma-GmbH'));
    assert.equal(out.artifactName, 'BBM-2.0.0-K-100-Musterfirma-GmbH-Setup.exe');
    const embedded = out.build.extraResources.find((entry) => entry.to === 'license/customer.bbmlic');
    assert.equal(Boolean(embedded), true);
    assert.equal(embedded.from.endsWith('customer.bbmlic'), true);
    assert.equal(out.build.directories.output, path.join('dist', 'customers', 'K-100-Musterfirma-GmbH'));
    assert.equal(out.build.nsis.artifactName, 'BBM-2.0.0-K-100-Musterfirma-GmbH-Setup.exe');
    assert.equal(out.build.npmRebuild, false);
    assert.equal(out.build.buildDependenciesFromSource, false);
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
}

module.exports = {
  runDistCustomerBuildTests,
};
