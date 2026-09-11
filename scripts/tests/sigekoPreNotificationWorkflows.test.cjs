"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { ensureSigekoSchema } = require("../../src/main/db/sigekoSchema");
const { SigekoPreNotificationWorkflowsRepository } = require("../../src/main/db/sigekoPreNotificationWorkflowsRepo");
const { SIGEKO_PRE_NOTIFICATION_WORKFLOW_COLUMNS: COLUMNS, validatePreNotificationWorkflowRow, parseSignedReturnFile, workflowStatus } = require("../../src/shared/sigeko/preNotificationWorkflows.cjs");
const { validateDocumentFile, parseSigekoDocumentFiles } = require("../../src/shared/sigeko/documents.cjs");
const T0 = "2026-09-10T12:00:00.000Z", T1 = "2026-09-10T12:01:00.000Z", T2 = "2026-09-10T12:02:00.000Z";
const signedFile = () => ({ kind: "signed", projectRelativePath: "SiGeKo/Unterlagen/Vorankuendigung-unterschrieben.pdf", sha256: "a".repeat(64), byteSize: 27 });
const row = (patch = {}) => ({ document_id: "d1", project_id: "p1", signed_file_json: null, signed_received_at: null,
  signature_opened_at: null, authority_opened_at: null, return_requested_by: null, returned_on: null, authority_sent_on: null, revision: 1, created_at: T0, updated_at: T0, ...patch });
function fixture(check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-s54-workflows-")), file = path.join(root, "data.db");
  let db = new Database(file); db.pragma("foreign_keys=ON");
  try {
    db.exec("CREATE TABLE projects(id TEXT PRIMARY KEY); CREATE TABLE persons(id TEXT PRIMARY KEY); CREATE TABLE project_persons(id TEXT PRIMARY KEY); INSERT INTO projects VALUES('p1'),('p2');");
    ensureSigekoSchema(db);
    // Recreate the pre-S5.4 boundary: final documents already exist when
    // the additive workflow table and composite ownership index migrate in.
    db.exec("DROP TABLE sigeko_pre_notification_workflows; DROP INDEX sigeko_documents_id_project;");
    // Schema fixtures deliberately carry just the existing database identity
    // contract; no test claims these are rendered or complete PDF snapshots.
    for (const [id, projectId] of [["d1", "p1"], ["d2", "p2"]]) db.prepare("INSERT INTO sigeko_documents VALUES(?,?,?,?,?,?)")
      .run(id, projectId, "sigeko-vorankuendigung", JSON.stringify({ documentId: id, projectId, documentTypeId: "sigeko-vorankuendigung" }), "[]", T0);
    ensureSigekoSchema(db);
    const repo = new SigekoPreNotificationWorkflowsRepository({ dbProvider: () => db });
    return check({ repo, get db() { return db; }, reopen() { db.close(); db = new Database(file); db.pragma("foreign_keys=ON"); ensureSigekoSchema(db); } });
  } finally { if (db.open) db.close(); fs.rmSync(root, { recursive: true, force: true }); }
}
async function runSigekoPreNotificationWorkflowTests(run) {
  await run("S5.4: workflow migration and reopening preserve old final documents and new state", () => fixture(ctx => {
    const before = ctx.db.prepare("SELECT * FROM sigeko_documents ORDER BY id").all();
    const saved = ctx.repo.save(row({ signature_opened_at: T0, return_requested_by: "2026-09-24" }), null);
    assert.deepEqual(ctx.db.prepare("PRAGMA table_info(sigeko_pre_notification_workflows)").all().map(item => item.name), COLUMNS);
    ctx.reopen(); assert.deepEqual(ctx.repo.get("p1", "d1"), saved);
    assert.deepEqual(ctx.db.prepare("SELECT * FROM sigeko_documents ORDER BY id").all(), before);
    assert.equal(ctx.db.pragma("integrity_check", { simple: true }), "ok");
    assert.deepEqual(ctx.db.pragma("foreign_key_check"), []);
    assert.throws(() => ctx.db.prepare("UPDATE sigeko_documents SET created_at=? WHERE id='d1'").run(T1), /unveränderlich/);
  }));
  await run("S5.4: workflow creation and updates use exact compare-and-swap revisions", () => fixture(({ repo }) => {
    assert.equal(repo.get("p1", "d1"), null);
    const first = repo.save(row(), null);
    assert.throws(() => repo.save(row(), null), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    const second = repo.save({ ...first, signature_opened_at: T1, updated_at: T1, revision: 2 }, 1);
    assert.equal(second.revision, 2);
    assert.throws(() => repo.save({ ...second, updated_at: T2 }, 1), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    assert.deepEqual(repo.get("p1", "d1"), second);
    for (const expected of [undefined, 0, -1, "2", 1.5]) assert.throws(() => repo.save({ ...second, revision: 3 }, expected), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    assert.throws(() => repo.save({ ...second, revision: 4 }, 2), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
  }));
  await run("S5.4: workflow state cannot attach to another project's final document", () => fixture(({ repo, db }) => {
    assert.throws(() => repo.save(row({ project_id: "p2" }), null), /FOREIGN KEY/);
    assert.throws(() => repo.save(row({ document_id: "missing" }), null), /FOREIGN KEY/);
    repo.save(row(), null); assert.equal(repo.get("p2", "d1"), null);
    assert.throws(() => repo.save(row({ project_id: "p2", revision: 2 }), 1), { code: "PRE_NOTIFICATION_WORKFLOW_CONFLICT" });
    assert.throws(() => db.prepare("UPDATE sigeko_pre_notification_workflows SET project_id='p2'").run(), /FOREIGN KEY/);
    assert.equal(repo.get("p1", "d1").revision, 1);
  }));
  await run("S5.4: deleting documents or their project cascades only matching workflows", () => fixture(({ repo, db }) => {
    repo.save(row(), null); repo.save(row({ document_id: "d2", project_id: "p2" }), null);
    db.prepare("DELETE FROM sigeko_documents WHERE id='d1'").run();
    assert.equal(repo.get("p1", "d1"), null); assert.ok(repo.get("p2", "d2"));
    db.prepare("DELETE FROM projects WHERE id='p2'").run(); assert.equal(repo.get("p2", "d2"), null);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  }));
  await run("S5.4: transaction rollback and timestamp invariants preserve the prior workflow", () => fixture(({ repo }) => {
    const first = repo.save(row(), null);
    assert.throws(() => repo.transaction(() => { repo.save({ ...first, revision: 2, updated_at: T1 }, 1); throw new Error("abort"); }), /abort/);
    assert.deepEqual(repo.get("p1", "d1"), first);
    assert.throws(() => repo.save({ ...first, revision: 2, created_at: "2026-09-09T12:00:00.000Z" }, 1), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    const second = repo.save({ ...first, revision: 2, updated_at: T2 }, 1);
    assert.throws(() => repo.save({ ...second, revision: 3, updated_at: T1 }, 2), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    assert.deepEqual(repo.get("p1", "d1"), second);
  }));
  await run("S5.4: signed returns have a strict file descriptor and paired receipt timestamp", () => {
    const complete = row({ signed_file_json: JSON.stringify(signedFile()), signed_received_at: T0 });
    assert.deepEqual(parseSignedReturnFile(validatePreNotificationWorkflowRow(complete, "p1")), signedFile());
    assert.equal(parseSignedReturnFile(row()), null);
    for (const patch of [{ signed_file_json: complete.signed_file_json }, { signed_received_at: T0 },
      { signed_file_json: "{" }, { signed_file_json: "null", signed_received_at: T0 },
      { signed_file_json: JSON.stringify({ ...signedFile(), kind: "main" }), signed_received_at: T0 },
      { signed_file_json: JSON.stringify({ ...signedFile(), extra: true }), signed_received_at: T0 },
      { signed_file_json: JSON.stringify({ ...signedFile(), projectRelativePath: "../signed.pdf" }), signed_received_at: T0 },
      { signed_file_json: JSON.stringify({ ...signedFile(), sha256: "x".repeat(64) }), signed_received_at: T0 },
      { signed_file_json: JSON.stringify({ ...signedFile(), byteSize: 0 }), signed_received_at: T0 }]) {
      assert.throws(() => validatePreNotificationWorkflowRow(row(patch), "p1"), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    }
  });
  await run("S5.4: signed file support does not allow signed files in immutable final document lists", () => {
    assert.deepEqual(validateDocumentFile(signedFile()), signedFile());
    for (const files of [[signedFile()], [{ ...signedFile(), kind: "main" }, signedFile()]]) {
      assert.throws(() => parseSigekoDocumentFiles({ files_json: JSON.stringify(files) }), { code: "SIGEKO_DOCUMENT_INVALID" });
    }
  });
  await run("S5.4: workflow row schema rejects unknown keys accessors wrong IDs and unsafe revisions", () => {
    assert.equal(validatePreNotificationWorkflowRow(row(), "p1").document_id, "d1");
    for (const candidate of [row({ extra: 1 }), row({ document_id: " d1" }), row({ project_id: "p2" }),
      row({ revision: 0 }), row({ revision: 1.5 }), row({ revision: Number.MAX_SAFE_INTEGER + 1 }),
      Object.fromEntries(Object.entries(row()).filter(([key]) => key !== "return_requested_by"))]) {
      assert.throws(() => validatePreNotificationWorkflowRow(candidate, "p1"), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    }
    const candidate = row(); Object.defineProperty(candidate, "document_id", { get() { assert.fail("Accessor must not execute"); } });
    assert.throws(() => validatePreNotificationWorkflowRow(candidate, "p1"), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
  });
  await run("S5.4: workflow dates are real calendar dates and event times never exceed update time", () => {
    assert.equal(validatePreNotificationWorkflowRow(row({ return_requested_by: "2028-02-29" }), "p1").return_requested_by, "2028-02-29");
    for (const patch of [{ created_at: "2026-02-30T12:00:00.000Z" }, { updated_at: "2026-09-09T12:00:00.000Z" },
      { created_at: "2026-09-10T12:00:00Z" }, { signature_opened_at: T1 },
      { return_requested_by: "2026-02-29" }, { return_requested_by: "0000-01-01" }, { return_requested_by: "2026-09-24T00:00:00.000Z" }]) {
      assert.throws(() => validatePreNotificationWorkflowRow(row(patch), "p1"), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    }
  });
  await run("S5.4: workflow status uses opened drafts with signed return required for authority", () => {
    const received = row({ signed_file_json: JSON.stringify(signedFile()), signed_received_at: T0 });
    assert.equal(workflowStatus(null), "red"); assert.equal(workflowStatus(row()), "red"); assert.equal(workflowStatus(received), "red");
    assert.equal(workflowStatus(row({ signature_opened_at: T0 })), "orange");
    assert.equal(workflowStatus({ ...received, authority_opened_at: T0 }), "green");
    assert.equal(workflowStatus({ ...received, signature_opened_at: T0, authority_opened_at: T0 }), "green");
    assert.throws(() => workflowStatus(row({ authority_opened_at: T0 })), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
  });
  await run("S5.4: workflow events cannot predate creation or mark a newer signed return as already handed over", () => fixture(({ repo, db }) => {
    const received = row({ signed_file_json: JSON.stringify(signedFile()), signed_received_at: T1, updated_at: T2 });
    const older = "2026-09-10T11:59:00.000Z";
    for (const key of ["signed_received_at", "signature_opened_at", "authority_opened_at"]) {
      assert.throws(() => validatePreNotificationWorkflowRow({ ...received, [key]: older }, "p1"), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    }
    assert.throws(() => workflowStatus({ ...received, authority_opened_at: T0 }), { code: "PRE_NOTIFICATION_WORKFLOW_INVALID" });
    assert.equal(workflowStatus({ ...received, authority_opened_at: T1 }), "green");
    repo.save(received, null);
    for (const [key, value] of [["signed_received_at", older], ["signature_opened_at", older], ["authority_opened_at", older], ["authority_opened_at", T0]]) {
      assert.throws(() => db.prepare(`UPDATE sigeko_pre_notification_workflows SET ${key}=? WHERE document_id='d1'`).run(value), /CHECK/);
      assert.deepEqual(repo.get("p1", "d1"), received);
    }
  }));
  await run("S5.4: SQLite enforces signed pairing authority prerequisites revisions and date integrity", () => fixture(({ repo, db }) => {
    const before = repo.save(row(), null);
    for (const statement of ["signed_received_at='2026-09-10T12:00:00.000Z'", "authority_opened_at='2026-09-10T12:00:00.000Z'", "revision=0", "revision=1.5",
      "return_requested_by='2026-02-30'", "created_at='2026-02-30T12:00:00.000Z'", "signature_opened_at='2026-09-10T12:01:00.000Z'", "updated_at='2026-09-09T12:00:00.000Z'"]) {
      assert.throws(() => db.prepare("UPDATE sigeko_pre_notification_workflows SET " + statement + " WHERE document_id='d1'").run(), /CHECK/);
      assert.deepEqual(repo.get("p1", "d1"), before);
    }
  }));
}
module.exports = { runSigekoPreNotificationWorkflowTests };
if (require.main === module) runSigekoPreNotificationWorkflowTests(async (name, check) => { await check(); console.log("PASS", name); })
  .catch(error => { console.error(error); process.exitCode = 1; });
