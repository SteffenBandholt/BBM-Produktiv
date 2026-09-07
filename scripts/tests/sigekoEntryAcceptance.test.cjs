const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { importEsmFromFile } = require('./_esmLoader.cjs');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const esm = file => importEsmFromFile(path.join(root, file));

// Derselbe kleine DOM-Testansatz wie die vorhandenen M83-Komponentenchecks.
class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.parentElement = null;
    this.dataset = {}; this.attributes = {}; this.isConnected = true; this.className = '';
    this.style = { setProperty(k,v) { this[k] = v; }, getPropertyValue(k) { return this[k] || ''; } };
    this.classList = { contains: k => this.className.split(/\s+/).includes(k) };
  }
  setAttribute(k,v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] ?? null; }
  append(...items) { for (const item of items) { item.parentElement = this; this.children.push(item); } }
  getBoundingClientRect() { return { left: 0, top: 0, width: 320, height: 24 }; }
}

async function runSigekoEntryAcceptanceTests(run) {
  const { getSigekoModuleEntry } = await esm('src/renderer/modules/sigeko/index.js');
  const { default: Router } = await esm('src/renderer/app/Router.js');
  const { default: ProjectsScreen } = await esm('src/renderer/modules/projektverwaltung/screens/ProjectsScreen.js');
  const refs = await esm('src/renderer/ui-editor/m80Refs.js');
  const registry = await esm('src/renderer/ui-editor/m80Registry.js');
  const { sigekoScreenUiEditorContract: contract } = await esm('src/renderer/modules/sigeko/SigekoScreen.uiEditorContract.js');
  const { seedSigekoAcceptanceProjects } = await esm('src/renderer/ui-editor/sigekoAcceptancePilot.js');
  const { bindDevelopmentUiEditorOpenButtonRef } = await esm('src/renderer/app/coreShellNavigation.js');
  const before = { document: global.document, window: global.window };
  const projects = [{ id: 'a', name: 'Projekt A', project_number: '25' }, { id: 'b', name: 'Projekt B', project_number: '26' }];
  let license = { valid: true, license: { modules: ['sigeko'] } };
  global.document = { createElement: tag => new Element(tag) };
  global.window = { dispatchEvent() {}, getComputedStyle: el => ({ ...el.style, fontSize: '12px', paddingLeft: '0px', paddingTop: '0px' }), bbmDb: {
    appIsPackaged: async () => ({ ok: true, isPackaged: true }),
    licenseGetStatus: async () => license,
    projectsList: async () => ({ ok: true, list: projects }),
  } };
  const router = {
    currentProjectId: null, currentMeetingId: 'old-meeting',
    ensureActiveModuleAccess: Router.prototype.ensureActiveModuleAccess,
    _resolveProjectId: Router.prototype._resolveProjectId,
    _setProjectRuntimeContext: Router.prototype._setProjectRuntimeContext,
    openProjectModule: Router.prototype.openProjectModule,
    openGlobalModule: Router.prototype.openGlobalModule,
    async show(view) { this.currentView?.destroy(); this.currentView = view; view.render(); await view.load(); },
    async showProjects() { this.lastNavigation = 'projects'; },
    async showProjectWorkspace(id) { this.lastNavigation = id; },
  };
  try {
    await run('S1.2: vorhandener Router oeffnet lizenziertes SiGeKo ohne Protokoll', async () => {
      assert.equal(await router.openProjectModule('a', 'sigeko', { project: projects[0] }), true);
      assert.equal(router.currentView.projectId, 'a');
      assert.equal(router.currentProjectId, 'a');
      assert.equal(router.currentMeetingId, null);
      assert.equal(router.currentView.uiEditorScopeId, 'sigeko.screen');
      assert.equal(router.currentView.projectLabel.textContent, 'Aktives Projekt: 25 – Projekt A');
      assert.equal(getSigekoModuleEntry().routing, undefined);
      assert.equal(await router.openGlobalModule('sigeko'), false);
    });
    await run('S1.2: echte Projektkachel wechselt Projekt und erneutes Oeffnen ersetzt die Referenzen', async () => {
      const first = router.currentView;
      const tile = { router };
      assert.equal(await ProjectsScreen.prototype._openProjectModuleFromTile.call(tile, { moduleId: 'sigeko', navigationKey: 'sigeko', project: projects[1] }), true);
      assert.equal(router.currentProjectId, 'b');
      assert.equal(router.currentView.projectLabel.textContent, 'Aktives Projekt: 26 – Projekt B');
      assert.equal(first.projectLabel.textContent, 'Aktives Projekt: 25 – Projekt A');
      await router.openProjectModule('a', 'sigeko');
      assert.notEqual(router.currentView, first);
      assert.equal(router.currentProjectId, 'a');
      assert.equal(refs.getM80Ref('sigeko.screen').element, router.currentView.root);
    });
    await run('S1.2: Freigabeentzug und Core-only sperren denselben generischen Einstieg', async () => {
      const previous = router.currentView;
      for (const status of [{ valid: true, license: { modules: [] } }, { valid: false, license: { modules: ['sigeko'] } }, { valid: true, license: { modules: ['protokoll'] } }]) {
        license = status;
        assert.equal(await router.openProjectModule('b', 'sigeko'), false);
        assert.equal(router.currentView, previous);
      }
      license = { valid: true, license: { modules: ['sigeko'] } };
    });
    await run('S1.2: alle elf sichtbaren Slots besitzen vollstaendige echte Kit-Vertraege und Einzel-Refs', () => {
      assert.equal(contract.slots.length, 11);
      assert.deepEqual(contract.requiredSlots, contract.slots.map(slot => slot.slotId));
      assert.equal(refs.validateM83ComponentReferences([contract.componentId]).ok, true);
      for (const slot of contract.slots) {
        const entry = registry.getM80RegistryEntry(slot.element.id);
        const ref = refs.getM80Ref(entry.id);
        assert.equal(ref.contractTargets.length, 1);
        assert.equal(ref.element.getAttribute('data-ui-inspector-id'), entry.id);
        assert.equal(ref.element.getAttribute('data-ui-editor-parent'), entry.parentId || '');
        if (entry.parentId) assert.equal(ref.element.parentElement, refs.getM80Ref(entry.parentId).element);
        assert.ok(entry.lockedOps.includes('modifyDomainData'));
        assert.ok(entry.allowedOps.includes('move'));
        if (entry.hasVisibleText) assert.ok(entry.allowedOps.includes('textResize'));
      }
      const scope = registry.listM80RegistryScopes().find(entry => entry.scopeId === 'sigeko.screen');
      assert.equal(scope.status, 'complete');
      assert.deepEqual(registry.BBM_M80_ACTIVE_SCOPE_GROUPS.at(-1), ['sigeko.screen']);
    });
    await run('S1.2: bestehender Header-Editorstart bindet den SiGeKo-Scope', () => {
      assert.equal(bindDevelopmentUiEditorOpenButtonRef({ scopeId: 'sigeko.screen', button: new Element('button') }), true);
      assert.equal(refs.validateM83ComponentReferences(['bbm.sigeko.mainHeaderLauncher']).ok, true);
    });
    await run('S1.2: genau zwei echte Rueckwege, keine Fachaktion und umbruchfaehiger Einstieg', async () => {
      const buttons = contract.slots.filter(slot => slot.element.type === 'button');
      assert.deepEqual(buttons.map(slot => slot.element.id), ['sigeko.screen.workspace', 'sigeko.screen.projects']);
      await refs.getM80Ref('sigeko.screen.workspace').element.onclick();
      assert.equal(router.lastNavigation, 'a');
      await refs.getM80Ref('sigeko.screen.projects').element.onclick();
      assert.equal(router.lastNavigation, 'projects');
      assert.match(refs.getM80Ref('sigeko.screen.planned.title').element.textContent, /noch nicht umgesetzt/);
      assert.match(refs.getM80Ref('sigeko.screen.navigation').element.style.cssText, /flex-wrap:wrap/);
      assert.match(router.currentView.root.style.cssText, /min-width:0;max-width:100%/);
    });
    await run('S1.2: fremdes Projektobjekt wird nicht uebernommen; Ladefehler bleibt sichtbar', async () => {
      await router.openProjectModule('a', 'sigeko', { project: projects[1] });
      assert.equal(router.currentView.project.id, 'a');
      global.window.bbmDb.projectsList = async () => { throw new Error('offline'); };
      await router.openProjectModule('missing', 'sigeko');
      assert.equal(router.currentView.project, null);
      assert.match(router.currentView.notice.textContent, /konnte nicht geladen/);
      assert.doesNotMatch(router.currentView.projectLabel.textContent, /Projekt A|Projekt B/);
    });
    await run('S1.2: Abnahme-Seeding verweigert jeden API-Zugriff ohne isoliertes Profil', async () => {
      const api = new Proxy({}, { get() { assert.fail('Produktivzugriff'); } });
      await assert.rejects(seedSigekoAcceptanceProjects({ api }), /REQUIRES_ISOLATED_PROFILE/);
    });
    await run('S1.2: zwei neutrale Abnahmeprojekte, Wiederstart ohne Duplikate oder SiGeKo-Fachschreiben', async () => {
      const list = [];
      const api = { projectsList: async () => ({ ok: true, list }), projectsCreate: async data => { const project = { id: `fixture-${list.length}`, ...data }; list.push(project); return { ok: true, project }; } };
      const first = await seedSigekoAcceptanceProjects({ api, isolatedAcceptance: true });
      const second = await seedSigekoAcceptanceProjects({ api, isolatedAcceptance: true });
      assert.equal(list.length, 2); assert.deepEqual(first, second);
      assert.deepEqual(list.map(p => p.project_number), ['S12-A', 'S12-B']);
      const pilot = read('src/renderer/ui-editor/sigekoAcceptancePilot.js');
      assert.match(pilot, /router\.showProjectWorkspace/);
      assert.match(pilot, /router\.openProjectModule/);
      assert.match(pilot, /openNativeUiEditor\(\{ scopeId: "sigeko.screen"/);
    });
    await run('S1.2: vorhandener Windows-Starter und interne Testlizenz kennen SiGeKo', () => {
      const launcher = require('../runIsolatedUiEditorAcceptance.cjs');
      assert.equal(launcher.parseAcceptanceModule(['node', 'runner', '--module=sigeko']), 'sigeko');
      assert.ok(launcher.buildElectronArguments({ repoRoot: 'C:\\BBM', profileRoot: 'C:\\TEMP\\profile', module: 'sigeko' }).includes('--bbm-ui-editor-acceptance-module=sigeko'));
      assert.match(read('src/main/main.js'), /UI_EDITOR_ACCEPTANCE_MODULES = new Set\(\["restarbeiten", "protokoll", "rechnung", "sigeko"\]\)/);
      assert.ok(require('../../dev/internal/developmentLicenseProvider.cjs').createDevelopmentLicenseStatus().license.modules.includes('sigeko'));
    });
    await run('S1.2: isolierte DB lehnt Legacy-Import ab, bevor eine Quelldatei gelesen wird', () => {
      const file = path.join(root, 'src/main/db/database.js');
      const localRequire = createRequire(file);
      const dbModule = { exports: {} };
      vm.runInNewContext(read('src/main/db/database.js'), {
        module: dbModule, __dirname: path.dirname(file), console, process,
        require(name) {
          if (name === 'electron') return { app: { getPath: () => '/isolated/userData' } };
          if (name === 'fs') return new Proxy({}, { get() { assert.fail('Keine Legacy-Datei lesen'); } });
          return localRequire(name);
        },
      });
      dbModule.exports.configureDatabaseMigrations({ valid: true, license: { modules: ['sigeko'] } }, { allowLegacyImport: false });
      assert.equal(dbModule.exports.importLegacyIntoActive().ok, false);
      assert.match(read('src/main/main.js'), /allowLegacyImport: !uiEditorAcceptanceProfile.enabled/);
      assert.match(read('src/main/db/database.js'), /function ensureLegacyImportCopy[^]*?if \(!allowLegacyImport\) return;/);
    });
    await run('S1.2: SiGeKo importiert keine fremde Fachkomponente, DB oder eigene Freigabeengine', () => {
      for (const file of ['src/renderer/modules/sigeko/index.js', 'src/renderer/modules/sigeko/SigekoScreen.js', 'src/renderer/modules/sigeko/SigekoScreen.uiEditorContract.js', 'src/renderer/ui-editor/sigekoAcceptancePilot.js']) {
        assert.doesNotMatch(read(file), /from\s+["'][^"']*(?:protokoll|\/tops|restarbeiten|rechnung|sqlite|\/db\/)/i);
        assert.doesNotMatch(read(file), /CREATE TABLE|ALTER TABLE|requireFeature|enforceLicensedFeature/);
      }
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = before.document; global.window = before.window;
  }
}
module.exports = { runSigekoEntryAcceptanceTests };
