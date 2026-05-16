const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

async function withTemp(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-restarbeiten-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    if (request === "electron" && String(parent?.filename || "").endsWith(path.join("db", "database.js"))) {
      return { app: { getPath: (n) => (n === "userData" ? userDataPath : ""), isPackaged: true } };
    }
    return originalLoad.apply(this, arguments);
  };
  try {
    const dbPath = path.join(process.cwd(), "src/main/db/database.js");
    const repoPath = path.join(process.cwd(), "src/main/db/restarbeitenRepo.js");
    delete require.cache[require.resolve(dbPath)];
    delete require.cache[require.resolve(repoPath)];
    const db = require(dbPath);
    const repo = require(repoPath);
    return await fn({ db, repo });
  } finally {
    try { require(path.join(process.cwd(), "src/main/db/database.js")).closeDatabase(); } catch (_) {}
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function runRestarbeitenDataModelTests(run) {
  await run("Restarbeiten Schema wird angelegt", async () => withTemp(({ db }) => {
    const conn = db.initDatabase();
    for (const t of ["restarbeiten_items", "restarbeiten_project_settings", "restarbeiten_attachments"]) {
      assert.ok(conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t));
    }
    const cols = conn.prepare("PRAGMA table_info(restarbeiten_items)").all().map((c) => c.name);
    ["project_id","running_number","location_level_1","location_level_2","location_level_3","location_level_4","short_text","long_text","item_class","status","due_date","responsible_project_firm_id","responsible_label","archived_at","created_at","updated_at"].forEach((c)=>assert.ok(cols.includes(c)));
    const aCols = conn.prepare("PRAGMA table_info(restarbeiten_attachments)").all().map((c) => c.name);
    ["restarbeit_id","file_path","thumbnail_path","sort_order","is_primary"].forEach((c)=>assert.ok(aCols.includes(c)));
  }));

  await run("Projektbezug und running_number je Projekt", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p2", "P2");
    repo.createRestarbeitItem({ project_id: "p1", short_text: "A" });
    repo.createRestarbeitItem({ project_id: "p1", short_text: "B" });
    repo.createRestarbeitItem({ project_id: "p2", short_text: "C" });
    const p1 = repo.listRestarbeitItems("p1");
    assert.equal(p1.length, 2);
    assert.deepEqual(p1.map((x) => x.running_number), [1,2]);
    assert.equal(repo.listRestarbeitItems("p2")[0].running_number, 1);
  }));

  await run("Verortung und Settings", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p2", "P2");
    const item = repo.createRestarbeitItem({ project_id: "p1", location_level_1: "Haus A", location_level_2: "EG", location_level_3: "WE 1", location_level_4: "Kueche", status: "unbekannt" });
    assert.equal(item.location_level_1, "Haus A");
    assert.equal(item.location_level_4, "Kueche");
    assert.equal(item.status, "offen");
    const s1 = repo.getRestarbeitProjectSettings("p1");
    const s2 = repo.getRestarbeitProjectSettings("p2");
    assert.equal(s1.level_1_label, "Haus");
    assert.equal(s1.level_2_label, "Geschoss");
    assert.equal(s1.level_3_label, "Einheit");
    assert.equal(s1.level_4_label, "Raum");
    assert.notEqual(s1.project_id, s2.project_id);
  }));

  await run("item_class default, akzeptierte Werte und Normalisierung", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");

    const d = repo.createRestarbeitItem({ project_id: "p1", short_text: "Default" });
    const m = repo.createRestarbeitItem({ project_id: "p1", short_text: "Mangel", item_class: "mangel" });
    const upperM = repo.createRestarbeitItem({ project_id: "p1", short_text: "Upper", item_class: "MANGEL" });
    const mixedR = repo.createRestarbeitItem({ project_id: "p1", short_text: "Mixed", item_class: "Rest" });
    const invalid = repo.createRestarbeitItem({ project_id: "p1", short_text: "Invalid", item_class: "abc" });
    const empty = repo.createRestarbeitItem({ project_id: "p1", short_text: "Empty", item_class: "   " });

    assert.equal(d.item_class, "rest");
    assert.equal(m.item_class, "mangel");
    assert.equal(upperM.item_class, "mangel");
    assert.equal(mixedR.item_class, "rest");
    assert.equal(invalid.item_class, "rest");
    assert.equal(empty.item_class, "rest");

    const list = repo.listRestarbeitItems("p1");
    assert.ok(list.every((row) => typeof row.item_class === "string"));
    assert.equal(list.find((row) => row.id === m.id)?.item_class, "mangel");
  }));

  await run("Restarbeit Update normalisiert Felder und schuetzt Kernfelder", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    conn.prepare("INSERT INTO project_firms (id, project_id, name) VALUES (?, ?, ?)").run("f1", "p1", "Firma A");
    conn.prepare("INSERT INTO project_firms (id, project_id, name) VALUES (?, ?, ?)").run("f2", "p1", "Firma B");
    const item = repo.createRestarbeitItem({
      project_id: "p1",
      short_text: "Alt",
      long_text: "Lang alt",
      item_class: "rest",
      status: "offen",
      due_date: "2026-05-16",
      responsible_project_firm_id: "f1",
      responsible_label: "Firma A",
    });

    const updated = repo.updateRestarbeitItem(item.id, {
      project_id: "p2",
      running_number: 99,
      created_at: "2000-01-01",
      location_level_1: "Haus B",
      location_level_2: "EG",
      location_level_3: "W1",
      location_level_4: "Kueche",
      short_text: "Neu",
      long_text: "Lang neu",
      item_class: "MANGEL",
      status: "unbekannt",
      due_date: "2026-06-01",
      responsible_project_firm_id: "f2",
      responsible_label: "Firma B",
    });

    assert.equal(updated.project_id, "p1");
    assert.equal(updated.running_number, item.running_number);
    assert.equal(updated.created_at, item.created_at);
    assert.equal(updated.location_level_1, "Haus B");
    assert.equal(updated.location_level_4, "Kueche");
    assert.equal(updated.short_text, "Neu");
    assert.equal(updated.long_text, "Lang neu");
    assert.equal(updated.item_class, "mangel");
    assert.equal(updated.status, "offen");
    assert.equal(updated.due_date, "2026-06-01");
    assert.equal(updated.responsible_project_firm_id, "f2");
    assert.equal(updated.responsible_label, "Firma B");
    assert.equal(String(repo.listRestarbeitItems("p1")[0].id), String(item.id));
  }));

  await run("Restarbeit Update wirft bei unbekannter ID", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    assert.throws(() => repo.updateRestarbeitItem("unbekannt", { short_text: "x" }), /restarbeit not found/);
    assert.throws(() => repo.updateRestarbeitItem("unbekannt", {}), /restarbeit not found/);
  }));

  await run("Foto-Regeln inkl. primary und max 3", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    const item = repo.createRestarbeitItem({ project_id: "p1", short_text: "R1" });
    const a1 = repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/a.jpg" });
    assert.equal(a1.is_primary, 1);
    const a2 = repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/b.jpg", sort_order: 2 });
    const a3 = repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/c.jpg", sort_order: 3, is_primary: true });
    const list1 = repo.listRestarbeitAttachments(item.id);
    assert.equal(list1.length, 3);
    assert.equal(list1.filter((x) => x.is_primary === 1).length, 1);
    assert.equal(list1[0].id, a3.id);
    assert.throws(() => repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/d.jpg" }), /max 3/);
    repo.setPrimaryRestarbeitAttachment(item.id, a2.id);
    const list2 = repo.listRestarbeitAttachments(item.id);
    assert.equal(list2[0].id, a2.id);
    assert.equal(list2.filter((x) => x.is_primary === 1).length, 1);
  }));

  await run("Attachment-Delete entfernt Datensatz und liefert Pfade", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    const item = repo.createRestarbeitItem({ project_id: "p1", short_text: "R1" });
    const a1 = repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/a.jpg", thumbnail_path: "/a_t.jpg", is_primary: true });
    repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/b.jpg", sort_order: 2 });

    const result = repo.deleteRestarbeitAttachment(item.id, a1.id);
    assert.equal(result.deleted, true);
    assert.equal(result.file_path, "/a.jpg");
    assert.equal(result.thumbnail_path, "/a_t.jpg");
    assert.equal(repo.listRestarbeitAttachments(item.id).length, 1);
    assert.equal(repo.listRestarbeitAttachments(item.id)[0].is_primary, 1);
  }));

  await run("Attachment-Delete behaelt Primary bei Nicht-Primary-Loeschung", async () => withTemp(({ db, repo }) => {
    const conn = db.initDatabase();
    conn.prepare("INSERT INTO projects (id, name) VALUES (?, ?)").run("p1", "P1");
    const item = repo.createRestarbeitItem({ project_id: "p1", short_text: "R1" });
    const a1 = repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/a.jpg", is_primary: true });
    const a2 = repo.addRestarbeitAttachment({ restarbeit_id: item.id, project_id: "p1", file_path: "/b.jpg", sort_order: 2 });
    repo.deleteRestarbeitAttachment(item.id, a2.id);
    assert.equal(repo.listRestarbeitAttachments(item.id)[0].id, a1.id);
    assert.throws(() => repo.deleteRestarbeitAttachment(item.id, "x"), /attachment not found/);
  }));

}

module.exports = { runRestarbeitenDataModelTests };
