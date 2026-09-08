const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { importEsmFromFile } = require('./_esmLoader.cjs');
const { createRegistryFingerprint, createUiScopeFingerprint } = require('ui-editor-kit');
const { ElectronUiEditorSessionController, resolveBbmModuleLayoutProfileRoot } = require('../../src/main/ui-editor/electronUiEditorSession');
const ROOT = path.resolve(__dirname, '../..');

// Unveraenderter main d7fb63a / echtes Kit 0240ef8, vor S1.2 gemessen.
// Bestandsprofil-Fingerprints sind feste Testfixtures, kein zweites Zielmanifest.
const EXISTING_SCOPE_FINGERPRINTS = Object.freeze({
  'restarbeiten.header.root': 'sha256:fe9f86e5e6bc19c1371b80d4b7efe97df2a7d9aa3771cda3c8a3d2e49c4ce7d2',
  'restarbeiten.list.root': 'sha256:8c0be7e2b3aeaa4792f3e9d5e8a542f6bbd961cf7416314d7c7d840cccbb309b',
  'restarbeiten.edit.root': 'sha256:c83909172064d65e3229ecfcab6e99ac5d45980c24d990ecd67c60a5c8125442',
  'protokoll.screen.root': 'sha256:7251a69f8243bb21a4768170d75ea0d51a4a43a48db0cb4b06caaca565185029',
  'protokoll.list.root': 'sha256:3bf84a38e4db80d49102e9fd0e8e80202c354d451df63e77242a4f899b8c8e53',
  'protokoll.edit.root': 'sha256:e53adb228924f283bf1158613f70bd6a6b927065c9ca24eb528caded776c0005',
  'rechnung.screen': 'sha256:fe69b5db1f605d7817d2d28ef0913c84508424932785a76888902208daafda17',
});

function savedElement(scopeId, entry) {
  const saved = { elementId: entry.id, scopeId };
  const ops = new Set(entry.allowedOps);
  if (ops.has('move')) { saved.x = entry.baseline.x; saved.y = entry.baseline.y; }
  for (const dimension of ['width', 'height']) {
    const suffix = dimension[0].toUpperCase() + dimension.slice(1);
    if (ops.has('resize') || ops.has(`resize${suffix}`)) saved[dimension] = Number.isFinite(entry.baseline[dimension])
      ? entry.baseline[dimension] : Math.min(entry.baseline[`max${suffix}`] || 2400, Math.max(entry.baseline[`min${suffix}`] || 1, dimension === 'width' ? 640 : 64));
  }
  if (ops.has('textMove')) { saved.textOffsetX = entry.baseline.textOffsetX; saved.textOffsetY = entry.baseline.textOffsetY; }
  if (ops.has('textResize')) saved.fontSize = entry.baseline.fontSize;
  if (ops.has('setVisibility')) saved.visible = entry.baseline.visible;
  if ([...ops].some(op => op.startsWith('spacing'))) saved.spacing = { ...(entry.baseline.spacing || {}) };
  if (entry.tableColumnLayout) saved.table = { tableId: entry.tableBinding.tableId, columnId: entry.id, widthMode: entry.tableColumnLayout.widthMode, wrapMode: entry.tableColumnLayout.wrapMode, overflowMode: entry.tableColumnLayout.overflowMode };
  if (entry.tableLayout) saved.table = { tableId: entry.id, horizontalOverflowMode: entry.tableLayout.horizontalOverflowMode, rowHeightMode: entry.tableLayout.rowHeightMode };
  return saved;
}

async function runSigekoEditorManifestTests(run) {
  const registry = await importEsmFromFile(path.join(ROOT, 'src/renderer/ui-editor/m80Registry.js'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'ui-editor-target.json'), 'utf8'));
  const scopes = registry.listM80RegistryScopes();
  await run('S1.2-Fix: kanonisches Manifest enthaelt exakt den additiven SiGeKo-Scope', () => {
    assert.deepEqual(manifest.activeScopes, [...Object.keys(EXISTING_SCOPE_FINGERPRINTS), 'sigeko.screen', 'projektverwaltung.plannedStart']);
    assert.deepEqual(manifest.activeScopes, registry.BBM_M80_ACTIVE_SCOPES);
    assert.equal(manifest.registryVersion, registry.BBM_M80_REGISTRY_VERSION);
    assert.equal(manifest.registryFingerprint, createRegistryFingerprint(scopes));
    assert.equal(manifest.schemaVersion, 2); assert.equal(manifest.contractVersion, '1.2');
    assert.equal(manifest.profileRoot, '.ui-editor-kit/profiles');
    assert.deepEqual(manifest.scopes.filter(s => s.scopeId === 'sigeko.screen'), [
      { scopeId: 'sigeko.screen', status: 'complete', reason: null, elementCount: 12, missingReferenceCount: 0 },
    ]);
    assert.equal(scopes.find(s => s.scopeId === 'sigeko.screen').elements.length, 12);
  });
  await run('S1.2-Fix: alle sieben bisherigen Scope-Fingerprints bleiben bytegleich', () => {
    for (const [scopeId, fingerprint] of Object.entries(EXISTING_SCOPE_FINGERPRINTS)) {
      assert.equal(createUiScopeFingerprint(scopes.find(s => s.scopeId === scopeId)), fingerprint, scopeId);
    }
    assert.deepEqual(manifest.scopes.filter(s => !['sigeko.screen', 'projektverwaltung.plannedStart'].includes(s.scopeId)).map(s => [s.scopeId, s.status, s.elementCount]), [
      ['restarbeiten.header.root', 'complete', 44], ['restarbeiten.list.root', 'complete', 32], ['restarbeiten.edit.root', 'complete', 53],
      ['protokoll.screen.root', 'complete', 34], ['protokoll.list.root', 'complete', 32], ['protokoll.edit.root', 'complete', 38],
      ['rechnung.screen', 'complete', 87], ['bbm.remaining', 'blocked', 0], ['pdf.bbm.protocol', 'complete', 28],
    ]);
  });
  const registryScopes = scopes.map(scope => scope.status === 'complete' ? {
    ...scope, elements: scope.elements.map(entry => ({ ...entry, referenceResolved: true,
      ...(entry.baseline?.width === null || entry.baseline?.height === null ? { capturedBaseline: { width: 640, height: 64 } } : {}),
    })),
  } : scope);
  for (const activeScopes of registry.BBM_M80_ACTIVE_SCOPE_GROUPS) {
    const moduleId = activeScopes[0].split('.')[0];
    await run(`S1.2-Fix: echter Profil-Restore ${moduleId} ohne Editorprozess`, () => {
      const profileRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bbm-s12-restore-'));
      try {
        const registration = {
          applicationId: 'bbm-produktiv', displayName: 'BBM', framework: 'electron',
          registryVersion: registry.BBM_M80_REGISTRY_VERSION, registryStatus: 'incomplete',
          activeScopes, registryScopes,
          supportedOperations: [...manifest.supportedOperations, 'setHorizontalOverflowMode'],
          uiCapability: 'layout', pdfCapability: 'unavailable', labelFieldSeparation: true, visibilityCapability: true,
        };
        const document = { schemaVersion: 2, applicationId: 'bbm-produktiv', profileId: 'standard', savedAt: '2026-09-07T00:00:00Z', scopes: activeScopes.map(scopeId => {
          const scope = registryScopes.find(s => s.scopeId === scopeId);
          return { scopeId, registryFingerprint: EXISTING_SCOPE_FINGERPRINTS[scopeId] || createUiScopeFingerprint(scope), layoutState: { elements: scope.elements.map(entry => savedElement(scopeId, entry)) } };
        }) };
        const profile = resolveBbmModuleLayoutProfileRoot(profileRoot, registration);
        assert.equal(path.basename(profile.profileRoot), `module-${moduleId}`);
        fs.mkdirSync(profile.profileRoot, { recursive: true });
        const file = path.join(profile.profileRoot, 'standard.layout-profile.json');
        fs.writeFileSync(file, JSON.stringify(document));
        const before = fs.readFileSync(file);
        const controller = new ElectronUiEditorSessionController({
          app: { getAppPath: () => ROOT, getVersion: () => '1.5.0', getPath: () => profileRoot },
          ipcMain: { handle() {} }, getMainWindow: () => null, profileRootResolver: () => profileRoot,
          spawnProcess: () => assert.fail('Restore darf keinen Editorprozess starten'),
        });
        const loaded = controller.loadStartupLayout(registration);
        assert.equal(loaded.ok, true, JSON.stringify(loaded)); assert.equal(loaded.found, true);
        assert.equal(loaded.editorProcessRequired, false);
        assert.equal(controller.completeStartupLayout({ ok: true, profileSha256: loaded.profileSha256 }).ok, true);
        assert.deepEqual(fs.readFileSync(file), before);
      } finally { fs.rmSync(profileRoot, { recursive: true, force: true }); }
    });
  }
}
module.exports = { runSigekoEditorManifestTests };
