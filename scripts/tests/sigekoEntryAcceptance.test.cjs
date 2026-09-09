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
    sigekoListAuthorityRecords: async () => ({ ok: true, data: [] }),
    sigekoGetProjectAuthorities: async ({ projectId }) => ({ ok: true, data: { projectId, address: { street: null, zip: null, city: null }, status: 'red',
      categories: require('../../src/shared/sigeko/authorities.cjs').AUTHORITY_CATEGORIES.map(category => ({ category, status: category === 'EMERGENCY_112' ? 'green' : 'red',
        fixedPhone: category === 'EMERGENCY_112' ? '112' : category === 'POLICE' ? '110' : null,
        assignment: null, candidates: [], proposal: null, issues: [] })) } }),
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
  const routeReadiness = (projectId = 'a', projectStatus = 'green', authorityStatus = 'green') => ({ projectId,
    projectData: { status: projectStatus, issues: projectStatus === 'green' ? [] : [{ code: 'BUILDER_MISSING', message: 'Bauherr fehlt.' }] },
    authorities: { status: authorityStatus, issues: authorityStatus === 'green' ? [] : [{ code: 'AUTHORITY_UNCERTAIN', message: 'Behörde prüfen.' }] } });
  const gate = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { resolve, promise }; };
  const routeHost = () => ({
    ...router, currentView: { marker: 'previous-view' }, currentProjectId: 'a', shown: [],
    async show(view, options) { this.currentView = view; this.currentProjectId = view.projectId; this.shown.push({ view, options }); },
  });
  const openAdapter = (host, projectId = 'a', screen = 'preNotification') => getSigekoModuleEntry().routing.project({
    router: host, projectId, project: projects.find(project => project.id === projectId), options: { screen } });
  try {
    await run('S1.2: vorhandener Router oeffnet lizenziertes SiGeKo ohne Protokoll', async () => {
      assert.equal(await router.openProjectModule('a', 'sigeko', { project: projects[0] }), true);
      assert.equal(router.currentView.projectId, 'a');
      assert.equal(router.currentProjectId, 'a');
      assert.equal(router.currentMeetingId, null);
      assert.equal(router.currentView.uiEditorScopeId, 'sigeko.screen');
      assert.equal(router.currentView.projectLabel.textContent, 'Aktives Projekt: 25 – Projekt A');
      assert.equal(typeof getSigekoModuleEntry().routing.project, 'function');
      assert.equal(getSigekoModuleEntry().navigation.project.length, 1);
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
    await run('S1.2: alle sichtbaren Slots besitzen vollstaendige echte Kit-Vertraege und Einzel-Refs', () => {
      assert.equal(contract.slots.length, 207);
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
      assert.ok(registry.BBM_M80_ACTIVE_SCOPE_GROUPS.some(group => group.length === 1 && group[0] === 'sigeko.screen'));
      assert.deepEqual(registry.BBM_M80_ACTIVE_SCOPE_GROUPS.at(-1), ['sigeko.preNotification']);
    });
    await run('S1.2: bestehender Header-Editorstart bindet den SiGeKo-Scope', () => {
      assert.equal(bindDevelopmentUiEditorOpenButtonRef({ scopeId: 'sigeko.screen', button: new Element('button') }), true);
      assert.equal(refs.validateM83ComponentReferences(['bbm.sigeko.mainHeaderLauncher']).ok, true);
      assert.equal(bindDevelopmentUiEditorOpenButtonRef({ scopeId: 'sigeko.preNotification', button: new Element('button') }), true);
      assert.equal(refs.validateM83ComponentReferences(['bbm.sigeko.preNotification.mainHeaderLauncher']).ok, true);
    });
    await run('S1.2: genau zwei echte Rueckwege in der Navigation und umbruchfaehiger Einstieg', async () => {
      const buttons = contract.slots.filter(slot => slot.element.type === 'button' && slot.element.parentId === 'sigeko.screen.navigation');
      assert.deepEqual(buttons.map(slot => slot.element.id), ['sigeko.screen.workspace', 'sigeko.screen.projects', 'sigeko.screen.preNotification']);
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
    await run('S5.2: generic licensed entry reads fresh readiness and opens the known document through router.show', async () => {
      const host = routeHost(), calls = []; let confirms = 0;
      window.confirm = () => { confirms++; return false; };
      window.bbmDb.sigekoGetReadiness = async payload => { calls.push(payload); return { ok: true, data: routeReadiness(payload.projectId) }; };
      for (const project of projects) {
        assert.equal(await host.openProjectModule(project.id, 'sigeko', { project, screen: 'preNotification' }), true);
        assert.equal(host.currentView.projectId, project.id); assert.equal(host.currentView.uiEditorScopeId, 'sigeko.preNotification');
      }
      assert.deepEqual(calls, [{ projectId: 'a' }, { projectId: 'b' }]); assert.equal(confirms, 0);
      assert.equal(host.shown.length, 2); assert.deepEqual(host.shown[1].options, {
        section: 'sigeko', isTopsView: false, hideSidebar: true, pageTitle: 'Vorankündigung', activeModuleLabel: 'SiGeKo',
      });
      const previousView = host.currentView; license = { valid: true, license: { modules: ['protokoll'] } };
      assert.equal(await host.openProjectModule('a', 'sigeko', { screen: 'preNotification' }), false);
      assert.equal(host.currentView, previousView); assert.equal(calls.length, 2);
      license = { valid: true, license: { modules: ['sigeko'] } };
    });
    await run('S5.2: red and orange document entry each require exactly one fresh explicit confirmation', async () => {
      for (const [projectStatus, authorityStatus] of [['red', 'green'], ['green', 'orange'], ['green', 'red']]) {
        const host = routeHost(), previousView = host.currentView, messages = []; let accept = false, reads = 0;
        window.bbmDb.sigekoGetReadiness = async () => { reads++; return { ok: true, data: routeReadiness('a', projectStatus, authorityStatus) }; };
        window.confirm = message => { messages.push(message); return accept; };
        assert.equal(await openAdapter(host), false); assert.equal(host.currentView, previousView); assert.equal(host.shown.length, 0);
        assert.equal(messages.length, 1); assert.match(messages[0], /Bauherr fehlt|Behörde prüfen/);
        accept = true; assert.equal(await openAdapter(host), true); assert.equal(messages.length, 2); assert.equal(reads, 2);
        assert.equal(host.shown.length, 1); assert.equal(host.currentView.uiEditorScopeId, 'sigeko.preNotification');
      }
    });
    await run('S5.2: failed malformed and foreign readiness never replace the current view and remain retryable', async () => {
      const wrong = routeReadiness('b'), malformed = routeReadiness(); malformed.authorities.issues = null;
      for (const outcome of [{ ok: false, error: 'SQLite offline' }, { ok: true, data: null }, { ok: true, data: wrong }, { ok: true, data: malformed }, new Error('Transportfehler')]) {
        const host = routeHost(), previousView = host.currentView, errors = [];
        window.alert = message => errors.push(message); window.confirm = () => assert.fail('Technical errors must not ask to override readiness');
        window.bbmDb.sigekoGetReadiness = async () => { if (outcome instanceof Error) throw outcome; return outcome; };
        assert.equal(await openAdapter(host), false); assert.equal(host.currentView, previousView); assert.equal(host.shown.length, 0);
        assert.equal(errors.length, 1); assert.match(errors[0], /nicht geöffnet/);
        window.bbmDb.sigekoGetReadiness = async () => ({ ok: true, data: routeReadiness() });
        assert.equal(await openAdapter(host), true); assert.equal(host.shown.length, 1);
      }
    });
    await run('S5.2: unknown screen selectors are rejected without readiness calls or view replacement', async () => {
      const host = routeHost(), previousView = host.currentView;
      window.bbmDb.sigekoGetReadiness = () => assert.fail('Unknown selector must not read readiness');
      for (const screen of ['unknown', '../rechnung', 'PRENOTIFICATION', 0, false, null, {}, []]) {
        assert.equal(await openAdapter(host, 'a', screen), false); assert.equal(host.currentView, previousView);
      }
      assert.equal(await openAdapter(host, 'a', ''), true); assert.equal(host.currentView.uiEditorScopeId, 'sigeko.screen');
      assert.equal(host.shown.length, 1);
    });
    await run('S5.2: later module navigation supersedes pending readiness without a stale warning or reopened document', async () => {
      for (const outcome of [{ ok: true, data: routeReadiness('a', 'red', 'orange') }, { ok: false, error: 'Late error' }]) {
        const host = routeHost(), pendingResult = gate();
        window.bbmDb.sigekoGetReadiness = () => pendingResult.promise;
        window.confirm = () => assert.fail('Superseded route cannot ask'); window.alert = () => assert.fail('Superseded route cannot alert');
        const pending = openAdapter(host); assert.equal(await openAdapter(host, 'b', 'sigeko'), true);
        const current = host.currentView; pendingResult.resolve(outcome); assert.equal(await pending, false);
        assert.equal(host.currentView, current); assert.equal(host.currentView.projectId, 'b'); assert.equal(host.shown.length, 1);
      }
    });
    await run('S5.2: readiness cannot replace an independently changed host view or project context', async () => {
      for (const change of ['view', 'project']) {
        const host = routeHost(), pendingResult = gate(); window.bbmDb.sigekoGetReadiness = () => pendingResult.promise;
        window.confirm = () => assert.fail('Departed host cannot ask');
        const pending = openAdapter(host);
        if (change === 'view') host.currentView = { marker: 'another-screen' }; else host.currentProjectId = 'b';
        const current = host.currentView; pendingResult.resolve({ ok: true, data: routeReadiness('a', 'red', 'orange') });
        assert.equal(await pending, false); assert.equal(host.currentView, current); assert.equal(host.shown.length, 0);
      }
    });
    await run('S5.2: newer pre-notification entry wins even when the earlier readiness response arrives last', async () => {
      const host = routeHost(), older = gate(); let count = 0;
      window.bbmDb.sigekoGetReadiness = async ({ projectId }) => ++count === 1 ? older.promise : { ok: true, data: routeReadiness(projectId) };
      const first = openAdapter(host); assert.equal(await openAdapter(host, 'b'), true);
      older.resolve({ ok: true, data: routeReadiness('a') }); assert.equal(await first, false);
      assert.equal(host.currentView.projectId, 'b'); assert.equal(host.shown.length, 1);
    });
  } finally {
    refs.resetM80PilotWorkingStatesForDiagnostic();
    global.document = before.document; global.window = before.window;
  }
}
module.exports = { runSigekoEntryAcceptanceTests };
