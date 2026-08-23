const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withDirectory(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-firm-directory-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return { app: { getPath: (name) => (name === "userData" ? userDataPath : ""), isPackaged: true } };
    }
    return originalLoad.apply(this, arguments);
  };
  const paths = {
    db: path.join(process.cwd(), "src/main/db/database.js"),
    service: path.join(process.cwd(), "src/main/domain/firms/FirmDirectoryService.js"),
    rest: path.join(process.cwd(), "src/main/db/restarbeitenRepo.js"),
    firmsRepo: path.join(process.cwd(), "src/main/db/firmsRepo.js"),
    projectFirmsRepo: path.join(process.cwd(), "src/main/db/projectFirmsRepo.js"),
  };
  try {
    for (const modulePath of Object.values(paths)) delete require.cache[require.resolve(modulePath)];
    const database = require(paths.db);
    const { FirmDirectoryService } = require(paths.service);
    const rest = require(paths.rest);
    const firmsRepo = require(paths.firmsRepo);
    const projectFirmsRepo = require(paths.projectFirmsRepo);
    const db = database.initDatabase();
    const directory = new FirmDirectoryService({ dbProvider: () => db });
    return await fn({ database, db, directory, rest, firmsRepo, projectFirmsRepo });
  } finally {
    try {
      require(paths.db).closeDatabase();
    } catch (_) {}
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

function insertProject(db, id) {
  db.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run(id, `Projekt ${id}`);
}

async function runFirmDirectoryTests(run) {
  await run("Firmenlogik 01: frische DB besitzt neutrale Flags und globale Restarbeiten-FK", () =>
    withDirectory(({ db }) => {
      for (const table of ["firms", "project_firms"]) {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all();
        const byName = new Map(columns.map((column) => [column.name, column]));
        assert.equal(byName.get("use_project_participant")?.dflt_value, "0");
        assert.equal(byName.get("use_customer")?.dflt_value, "0");
      }
      assert.ok(
        db.prepare("PRAGMA table_info(restarbeiten_items)").all().some((column) => column.name === "responsible_global_firm_id")
      );
    }));

  await run("Firmenlogik 02-03: Bestandsmigration ist atomar, vollstaendig und idempotent", () =>
    withDirectory(({ database, db }) => {
      db.exec("DROP TABLE project_firms; DROP TABLE firms;");
      db.exec("CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT, removed_at TEXT, is_trashed INTEGER DEFAULT 0); CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, name TEXT, removed_at TEXT, is_active INTEGER DEFAULT 1);");
      insertProject(db, "p1");
      db.prepare("INSERT INTO firms (id, name, removed_at, is_trashed) VALUES ('g1', 'Global', NULL, 0), ('g2', 'Trash', '2025-01-01', 1)").run();
      db.prepare("INSERT INTO project_firms (id, project_id, name, removed_at, is_active) VALUES ('l1', 'p1', 'Lokal', NULL, 1), ('l2', 'p1', 'Archiv', '2025-01-01', 0)").run();
      db.prepare("INSERT INTO persons (id, firm_id, name) VALUES ('gp1', 'g1', 'Global Person')").run();
      db.prepare("INSERT INTO project_persons (id, project_firm_id, name) VALUES ('lp1', 'l1', 'Lokal Person')").run();
      db.prepare("INSERT INTO project_global_firms (project_id, firm_id) VALUES ('p1', 'g1')").run();
      const first = database.ensureFirmUsesSchema(db);
      assert.equal(first.changed.length, 4);
      assert.deepEqual(db.prepare("SELECT use_project_participant, use_customer FROM firms ORDER BY id").all(), [
        { use_project_participant: 1, use_customer: 0 },
        { use_project_participant: 1, use_customer: 0 },
      ]);
      assert.deepEqual(db.prepare("SELECT use_project_participant, use_customer FROM project_firms ORDER BY id").all(), [
        { use_project_participant: 1, use_customer: 0 },
        { use_project_participant: 1, use_customer: 0 },
      ]);
      assert.deepEqual(db.prepare("SELECT id, firm_id FROM persons").all(), [{ id: "gp1", firm_id: "g1" }]);
      assert.deepEqual(db.prepare("SELECT id, project_firm_id FROM project_persons").all(), [{ id: "lp1", project_firm_id: "l1" }]);
      assert.deepEqual(db.prepare("SELECT project_id, firm_id FROM project_global_firms").all(), [{ project_id: "p1", firm_id: "g1" }]);
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
      assert.throws(() => db.prepare("UPDATE firms SET use_customer = 2 WHERE id = 'g1'").run(), /CHECK constraint failed/);
      assert.throws(() => db.prepare("UPDATE project_firms SET use_project_participant = -1 WHERE id = 'l1'").run(), /CHECK constraint failed/);
      assert.equal(database.ensureFirmUsesSchema(db).changed.length, 0);

      db.exec("DELETE FROM project_persons; DELETE FROM persons; DELETE FROM project_global_firms;");
      db.exec("DROP TABLE project_firms; DROP TABLE firms;");
      db.exec("CREATE TABLE firms (id TEXT PRIMARY KEY, name TEXT); CREATE TABLE project_firms (id TEXT PRIMARY KEY, project_id TEXT, use_project_participant INTEGER, use_customer INTEGER);");
      db.prepare("INSERT INTO firms (id, name) VALUES ('rollback', 'Rollback')").run();
      db.prepare("INSERT INTO project_firms (id, project_id, use_project_participant, use_customer) VALUES ('invalid', 'p1', NULL, 0)").run();
      assert.throws(() => database.ensureFirmUsesSchema(db), /ungueltig/);
      assert.equal(
        db.prepare("PRAGMA table_info(firms)").all().some((column) => column.name === "use_project_participant"),
        false
      );
    }));

  await run("Firmenlogik 04-11: alle acht Art/Nutzungs-Kombinationen werden fachlich gefiltert", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      insertProject(db, "p2");
      const combinations = [
        ["none", 0, 0],
        ["participant", 1, 0],
        ["customer", 0, 1],
        ["both", 1, 1],
      ];
      for (const [name, projectParticipant, customer] of combinations) {
        const global = directory.create({
          origin: "firms",
          data: { name: `G ${name}` },
          uses: { projectParticipant, customer },
        });
        if (projectParticipant) {
          db.prepare("INSERT INTO project_global_firms (project_id, firm_id) VALUES (?, ?)").run("p1", global.id);
        }
        directory.create({
          origin: "project_firms",
          projectId: "p1",
          data: { name: `L ${name}` },
          uses: { projectParticipant, customer },
        });
      }
      const participants = directory.listProjectParticipants({ projectId: "p1" });
      const customers = directory.listCustomers({ projectId: "p1" });
      assert.deepEqual(participants.map((firm) => firm.name).sort(), ["G both", "G participant", "L both", "L participant"]);
      assert.deepEqual(customers.map((firm) => firm.name).sort(), ["G both", "G customer"]);
      assert.equal(directory.listProjectParticipants({ projectId: "p2" }).length, 0);
      assert.deepEqual(directory.listCustomers({ projectId: "p2" }).map((firm) => firm.name).sort(), ["G both", "G customer"]);
    }));

  await run("Firmenlogik 12-14: Anlagekontexte setzen Art, Scope und Defaults", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      const global = directory.create({ origin: "firms", data: { name: "Stamm" } });
      const local = directory.create({ origin: "project_firms", projectId: "p1", data: { name: "Projekt" } });
      const invoiceLocal = directory.create({ origin: "invoice", projectId: "p1", data: { name: "Kunde lokal" } });
      const invoiceGlobal = directory.create({ origin: "invoice", data: { name: "Kunde global" } });
      assert.deepEqual([global.kind, global.uses], ["global_firm", { projectParticipant: 1, customer: 0 }]);
      assert.deepEqual([local.kind, local.project_id, local.uses], ["project_firm", "p1", { projectParticipant: 1, customer: 0 }]);
      assert.deepEqual([invoiceLocal.kind, invoiceLocal.uses], ["global_firm", { projectParticipant: 0, customer: 1 }]);
      assert.deepEqual([invoiceGlobal.kind, invoiceGlobal.uses], ["global_firm", { projectParticipant: 0, customer: 1 }]);
    }));

  await run("Firmenlogik 15,43,47: Nutzungsaenderung prueft Impacts und Versionskonflikte", () =>
    withDirectory(({ db, directory, rest }) => {
      insertProject(db, "p1");
      const firm = directory.create({ origin: "firms", data: { name: "Aktiv" } });
      db.prepare("INSERT INTO project_global_firms (project_id, firm_id) VALUES (?, ?)").run("p1", firm.id);
      db.prepare("INSERT INTO persons (id, firm_id, name) VALUES (?, ?, ?)").run("person-open", firm.id, "Offen");
      db.prepare("INSERT INTO project_candidates (project_id, kind, person_id) VALUES (?, ?, ?)").run(
        "p1",
        "global_person",
        "person-open"
      );
      db.prepare("INSERT INTO meetings (id, project_id, meeting_index, is_closed) VALUES (?, ?, ?, 0)").run(
        "meeting-open",
        "p1",
        1
      );
      db.prepare("INSERT INTO meetings (id, project_id, meeting_index, is_closed) VALUES (?, ?, ?, 1)").run(
        "meeting-closed",
        "p1",
        2
      );
      db.prepare("INSERT INTO meeting_participants (meeting_id, kind, person_id) VALUES (?, ?, ?)").run(
        "meeting-open",
        "global_person",
        "person-open"
      );
      db.prepare("INSERT INTO tops (id, project_id, level, number, title) VALUES ('top-open', 'p1', 1, 1, 'Offen'), ('top-closed', 'p1', 1, 2, 'Historie')").run();
      db.prepare("INSERT INTO meeting_tops (meeting_id, top_id, responsible_kind, responsible_id, responsible_label) VALUES ('meeting-open', 'top-open', 'global_firm', ?, 'Aktiv'), ('meeting-closed', 'top-closed', 'global_firm', ?, 'Historie')").run(firm.id, firm.id);
      const openRest = rest.createRestarbeitItem({ project_id: "p1", short_text: "Offen", responsible_ref: firm.ref });
      const closedRest = rest.createRestarbeitItem({ project_id: "p1", short_text: "Historie", responsible_ref: firm.ref });
      db.prepare("UPDATE restarbeiten_items SET status = 'erledigt', completed_at = '2025-01-01' WHERE id = ?").run(closedRest.id);
      const assessment = directory.checkUseChange({ ref: firm.ref, uses: { projectParticipant: 0 } });
      assert.equal(assessment.allowed, false);
      for (const code of [
        "active_project_assignments",
        "active_persons",
        "active_candidates",
        "open_meeting_participants",
        "open_top_responsibilities",
        "open_restarbeiten",
      ]) {
        assert.ok(assessment.impacts.some((impact) => impact.code === code), code);
      }
      assert.throws(
        () => directory.setUses({ ref: firm.ref, uses: { projectParticipant: 0 } }),
        (error) => error.code === "FIRM_USE_BLOCKED"
      );
      db.prepare("UPDATE project_global_firms SET removed_at = 'x' WHERE project_id = ? AND firm_id = ?").run("p1", firm.id);
      db.prepare("DELETE FROM meeting_participants WHERE meeting_id = ?").run("meeting-open");
      db.prepare("DELETE FROM project_candidates WHERE project_id = 'p1' AND person_id = 'person-open'").run();
      db.prepare("DELETE FROM persons WHERE id = ?").run("person-open");
      db.prepare("DELETE FROM meeting_tops WHERE meeting_id = 'meeting-open'").run();
      db.prepare("DELETE FROM restarbeiten_items WHERE id = ?").run(openRest.id);
      assert.throws(
        () => directory.setUses({ ref: firm.ref, uses: { customer: 1 }, expectedUpdatedAt: "stale" }),
        (error) => error.code === "FIRM_VERSION_CONFLICT"
      );
      const updated = directory.setUses({ ref: firm.ref, uses: { projectParticipant: 0, customer: 1 } });
      assert.deepEqual(updated.uses, { projectParticipant: 0, customer: 1 });
      assert.equal(updated.name, "Aktiv");
      assert.deepEqual(
        db.prepare("SELECT responsible_kind, responsible_id, responsible_label FROM meeting_tops WHERE meeting_id = 'meeting-closed'").get(),
        { responsible_kind: "global_firm", responsible_id: firm.id, responsible_label: "Historie" }
      );
      assert.deepEqual(
        db.prepare("SELECT responsible_global_firm_id, responsible_label FROM restarbeiten_items WHERE id = ?").get(closedRest.id),
        { responsible_global_firm_id: firm.id, responsible_label: "Aktiv" }
      );
    }));

  await run("Firmenlogik 16-17: Zuordnungs- und Aktivstatus beeinflussen nur Teilnehmerpicker", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      const global = directory.create({ origin: "firms", data: { name: "G" }, uses: { projectParticipant: 1, customer: 1 } });
      const local = directory.create({ origin: "project_firms", projectId: "p1", data: { name: "L" }, uses: { projectParticipant: 1, customer: 1 } });
      db.prepare("INSERT INTO project_global_firms (project_id, firm_id, is_active) VALUES (?, ?, 0)").run("p1", global.id);
      db.prepare("UPDATE project_firms SET is_active = 0 WHERE id = ?").run(local.id);
      db.prepare("INSERT INTO persons (id, firm_id, name) VALUES ('pg', ?, 'Global Person')").run(global.id);
      db.prepare("INSERT INTO project_persons (id, project_firm_id, name) VALUES ('pl', ?, 'Local Person')").run(local.id);
      assert.equal(directory.listProjectParticipants({ projectId: "p1" }).length, 0);
      assert.equal(directory.listProjectParticipants({ projectId: "p1", includeInactive: true }).length, 2);
      assert.equal(directory.listCustomers({ projectId: "p1" }).length, 1);
      assert.equal(directory.listPersons({ ref: global.ref, projectId: "p1", participantOnly: true }).length, 0);
      assert.equal(directory.listPersons({ ref: local.ref, participantOnly: true }).length, 0);
    }));

  await run("Firmenlogik 20-21: gleicher Name, gleiche Kurzbezeichnung und gleiche rohe ID bleiben typisiert getrennt", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      db.prepare("INSERT INTO firms (id, short, name, use_project_participant) VALUES ('same', 'WTB', 'WTB', 1), ('g-short', 'KURZ', 'Global anderer Name', 1)").run();
      db.prepare("INSERT INTO project_firms (id, project_id, short, name, use_project_participant) VALUES ('same', 'p1', 'WTB', 'WTB', 1), ('l-short', 'p1', 'KURZ', 'Lokal anderer Name', 1)").run();
      db.prepare("INSERT INTO project_global_firms (project_id, firm_id) VALUES ('p1', 'same'), ('p1', 'g-short')").run();
      const rows = directory.listProjectParticipants({ projectId: "p1" });
      assert.deepEqual(rows.map((row) => row.key).sort(), [
        "global_firm:g-short",
        "global_firm:same",
        "project_firm:l-short",
        "project_firm:same",
      ]);
      assert.equal(rows.filter((row) => row.label === "WTB").length, 2);
      assert.equal(rows.filter((row) => row.label === "KURZ").length, 2);
    }));

  await run("Firmenlogik 25-28,39: Restarbeiten speichern lokale, globale und Legacy-Referenzen", () =>
    withDirectory(({ db, directory, rest }) => {
      insertProject(db, "p1");
      const local = directory.create({ origin: "project_firms", projectId: "p1", data: { name: "Lokal" } });
      const global = directory.create({ origin: "firms", data: { name: "Global" } });
      const customer = directory.create({ origin: "firms", data: { name: "Nur Kunde" }, uses: { projectParticipant: 0, customer: 1 } });
      db.prepare("INSERT INTO project_global_firms (project_id, firm_id) VALUES ('p1', ?)").run(global.id);
      const l = rest.createRestarbeitItem({ project_id: "p1", short_text: "L", responsible_ref: local.ref });
      const g = rest.createRestarbeitItem({ project_id: "p1", short_text: "G", responsible_ref: global.ref });
      assert.deepEqual([l.responsible_kind, l.responsible_id, l.responsible_label], ["project_firm", local.id, "Lokal"]);
      assert.deepEqual([g.responsible_kind, g.responsible_id, g.responsible_label], ["global_firm", global.id, "Global"]);
      assert.throws(
        () => rest.createRestarbeitItem({ project_id: "p1", short_text: "K", responsible_ref: customer.ref }),
        /not an active project participant/
      );
      const legacy = db.prepare("SELECT * FROM restarbeiten_items WHERE id = ?").get(l.id);
      assert.equal(legacy.responsible_project_firm_id, local.id);
    }));

  await run("Firmenlogik 29-32: Importdefaults und Merge bleiben scope- und nutzungstreu", () =>
    withDirectory(({ db, directory, firmsRepo, projectFirmsRepo }) => {
      insertProject(db, "p1");
      const existing = directory.create({
        origin: "invoice",
        data: { name: "Merge GmbH" },
      });
      firmsRepo.importFromOutlookStaging([
        { take: 1, name1: "Merge GmbH", phone: "123" },
        { take: 1, name1: "Neu Global" },
      ]);
      projectFirmsRepo.importFromOutlookStaging({
        projectId: "p1",
        stagingRows: [
          { take: 1, name1: "Neu Lokal" },
          { take: 1, name1: "Neu Global" },
        ],
      });
      const merged = directory.get(existing.ref);
      assert.deepEqual(merged.uses, { projectParticipant: 0, customer: 1 });
      assert.equal(merged.phone, "123");
      const globalImported = directory.listAll({ kind: "global_firm" }).find((row) => row.name === "Neu Global");
      const localImported = directory
        .listAll({ kind: "project_firm", projectId: "p1" })
        .find((row) => row.name === "Neu Global");
      assert.deepEqual(globalImported.uses, { projectParticipant: 1, customer: 0 });
      assert.deepEqual(localImported.uses, { projectParticipant: 1, customer: 0 });
      assert.notEqual(globalImported.key, localImported.key);
    }));

  await run("Firmenlogik 40-42,49-51: Kundenlisten arbeiten mit und ohne Projekt unabhaengig", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      directory.create({ origin: "invoice", data: { name: "Global" } });
      directory.create({ origin: "invoice", projectId: "p1", data: { name: "Lokal" } });
      directory.create({ origin: "firms", data: { name: "Nur Teilnehmer" } });
      assert.deepEqual(directory.listCustomers({}).map((row) => row.name).sort(), ["Global", "Lokal"]);
      assert.deepEqual(directory.listCustomers({ projectId: "p1" }).map((row) => row.name).sort(), ["Global", "Lokal"]);
    }));

  await run("Firmenlogik 44,46: Scopefehler sind deterministisch, abgeschlossene Historie blockiert nicht", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      insertProject(db, "p2");
      const local = directory.create({ origin: "project_firms", projectId: "p1", data: { name: "Historie" } });
      assert.equal(directory.get({ ...local.ref, projectId: "p2" }), null);
      assert.throws(() => directory.get({ kind: "customer", id: local.id }), /firm kind/);
      const updated = directory.setUses({ ref: local.ref, uses: { projectParticipant: 0 } });
      assert.equal(updated.uses.projectParticipant, 0);
    }));

  await run("Firmenlogik 48: Globalisierung ist als nicht-mutierende Servicegrenze vorbereitet", () =>
    withDirectory(({ db, directory }) => {
      insertProject(db, "p1");
      directory.create({ origin: "firms", data: { name: "Doppelt" } });
      const local = directory.create({ origin: "project_firms", projectId: "p1", data: { name: "Doppelt" } });
      const plan = directory.prepareLocalToGlobal({ ref: local.ref });
      assert.equal(plan.executable, false);
      assert.equal(plan.boundary, "local_to_global_preparation_v1");
      assert.equal(plan.matchingGlobalFirms.length, 1);
      assert.deepEqual(plan.requiredDecisions, ["target_global_firm", "person_merge", "reference_rewrite"]);
    }));
}

module.exports = { runFirmDirectoryTests };
