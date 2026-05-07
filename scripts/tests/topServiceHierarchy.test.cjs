const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const { createTopService } = require("../../src/main/domain/TopService");

function withMockedMeetingTopsRepo(fn) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-meeting-tops-"));
  const userDataPath = path.join(tmpRoot, "userData");
  fs.mkdirSync(userDataPath, { recursive: true });

  class FakeStatement {
    constructor(db, sql) {
      this.db = db;
      this.sql = String(sql || "");
    }
    all(...params) {
      return this.db._all(this.sql, params);
    }
    get(...params) {
      return this.db._get(this.sql, params);
    }
    run(...params) {
      return this.db._run(this.sql, params);
    }
  }

  class FakeDatabase {
    constructor(filePath) {
      this.filePath = filePath;
      this.tables = new Map([
        [
          "meeting_tops",
          {
            columns: [
              "meeting_id",
              "top_id",
              "status",
              "due_date",
              "longtext",
              "is_carried_over",
              "completed_in_meeting_id",
              "is_important",
              "is_touched",
              "is_task",
              "is_decision",
              "responsible_kind",
              "responsible_id",
              "responsible_label",
              "contact_kind",
              "contact_person_id",
              "contact_label",
              "created_at",
              "updated_at",
            ],
            rows: [],
          },
        ],
        ["projects", { columns: ["id"], rows: [] }],
        ["meetings", { columns: ["id"], rows: [] }],
        ["tops", { columns: ["id"], rows: [] }],
      ]);
    }

    prepare(sql) {
      return new FakeStatement(this, sql);
    }

    exec() {
      return this;
    }

    close() {}

    _table(name) {
      return this.tables.get(String(name)) || null;
    }

    _rowClone(row) {
      return row ? { ...row } : undefined;
    }

    _tableExists(name) {
      return !!this._table(name);
    }

    _columnInfo(tableName) {
      const table = this._table(tableName);
      return table ? table.columns.map((name) => ({ name })) : [];
    }

    _meetingTopRowsFor(meetingId) {
      return (this._table("meeting_tops")?.rows || []).filter((row) => String(row.meeting_id) === String(meetingId));
    }

    _all(sql, params) {
      const text = String(sql || "");
      if (text.includes("sqlite_master") && text.includes("name IN")) {
        return params.filter((name) => this._tableExists(name)).map((name) => ({ name }));
      }
      if (text.includes("sqlite_master") && text.includes("name=?")) {
        const name = params[0];
        return this._tableExists(name) ? [{ name }] : [];
      }
      const pragmaMatch = text.match(/PRAGMA table_info\(([^)]+)\)/i);
      if (pragmaMatch) {
        return this._columnInfo(pragmaMatch[1]);
      }
      return [];
    }

    _get(sql, params) {
      const text = String(sql || "");
      if (text.includes("sqlite_master")) {
        return this._all(text, params)[0];
      }
      if (/SELECT\s+\*\s+FROM\s+meeting_tops\s+WHERE\s+meeting_id\s+=\s+\?\s+AND\s+top_id\s+=\s+\?/i.test(text)) {
        const [meetingId, topId] = params;
        return this._rowClone(
          this._meetingTopRowsFor(meetingId).find((row) => String(row.top_id) === String(topId))
        );
      }
      if (/SELECT\s+COUNT\(\*\)\s+AS\s+n\s+FROM\s+meeting_tops\s+WHERE\s+meeting_id\s+=\s+\?/i.test(text)) {
        const [meetingId] = params;
        return { n: this._meetingTopRowsFor(meetingId).length };
      }
      return undefined;
    }

    _run(sql, params) {
      const text = String(sql || "");
      if (/INSERT OR IGNORE INTO meeting_tops/i.test(text) && /VALUES/i.test(text)) {
        const colsMatch = text.match(/INSERT OR IGNORE INTO meeting_tops\s*\(([^)]+)\)\s*VALUES/i);
        if (!colsMatch) return { changes: 0 };
        const cols = colsMatch[1].split(",").map((part) => part.trim());
        const row = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        const table = this._table("meeting_tops");
        const exists = table.rows.some(
          (existing) =>
            String(existing.meeting_id) === String(row.meeting_id) &&
            String(existing.top_id) === String(row.top_id)
        );
        if (exists) return { changes: 0 };
        table.rows.push({ ...row });
        return { changes: 1 };
      }

      if (/INSERT OR IGNORE INTO meeting_tops/i.test(text) && /SELECT/i.test(text)) {
        const table = this._table("meeting_tops");
        const hasCreatedAt = /AS created_at/i.test(text);
        const hasUpdatedAt = /AS updated_at/i.test(text);
        const offset = 1 + (hasCreatedAt ? 1 : 0) + (hasUpdatedAt ? 1 : 0);
        const targetMeetingId = params[0];
        const fromMeetingId = params[offset];

        const carriedRows = this._meetingTopRowsFor(fromMeetingId).filter((row) => {
          const status = String(row.status || "").trim().toLowerCase();
          if (status !== "erledigt") return true;
          const completed = row.completed_in_meeting_id;
          return completed === null || completed === undefined || String(completed) === String(fromMeetingId);
        });

        let inserted = 0;
        for (const source of carriedRows) {
          const exists = table.rows.some(
            (existing) =>
              String(existing.meeting_id) === String(targetMeetingId) &&
              String(existing.top_id) === String(source.top_id)
          );
          if (exists) continue;
          table.rows.push({
            ...source,
            meeting_id: targetMeetingId,
            is_carried_over: 1,
          });
          inserted += 1;
        }
        return { changes: inserted };
      }

      if (/UPDATE meeting_tops\s+SET/i.test(text)) {
        const setMatch = text.match(/UPDATE meeting_tops\s+SET\s+(.+?)\s+WHERE\s+meeting_id = \?\s+AND\s+top_id = \?/is);
        if (!setMatch) return { changes: 0 };
        const setCols = setMatch[1]
          .split(",")
          .map((part) => part.trim())
          .map((part) => part.replace(/\s*=\s*\?/g, ""));
        const meetingId = params[setCols.length];
        const topId = params[setCols.length + 1];
        const row = this._meetingTopRowsFor(meetingId).find((item) => String(item.top_id) === String(topId));
        if (!row) return { changes: 0 };
        setCols.forEach((col, idx) => {
          row[col] = params[idx];
        });
        return { changes: 1 };
      }

      return { changes: 0 };
    }
  }

  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const fromDatabase = String(parent?.filename || "").endsWith(path.join("src", "main", "db", "database.js"));
    if (fromDatabase && request === "electron") {
      return {
        app: {
          isPackaged: false,
          getPath: (name) => (name === "userData" ? userDataPath : ""),
          },
        };
      }
    if (fromDatabase && request === "better-sqlite3") {
      return FakeDatabase;
    }
    return originalLoad.apply(this, arguments);
  };

  try {
    const databaseModPath = path.join(process.cwd(), "src/main/db/database.js");
    const repoModPath = path.join(process.cwd(), "src/main/db/meetingTopsRepo.js");
    delete require.cache[require.resolve(databaseModPath)];
    delete require.cache[require.resolve(repoModPath)];
    const repo = require(repoModPath);
    return fn(repo);
  } finally {
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

async function runTopServiceHierarchyTests(run) {
  await run("TopService: Kind-TOPs werden immer als Unterpunkte mit Parent-Level angelegt", () => {
    const tops = new Map([
      ["1", { id: "1", project_id: "p1", level: 1, title: "Titel 1" }],
    ]);
    const created = [];
    const topsRepo = {
      getNextNumber(projectId, parentTopId) {
        assert.equal(projectId, "p1");
        assert.equal(parentTopId, "1");
        return 1;
      },
      getTopById(topId) {
        return tops.get(String(topId)) || null;
      },
      createTop(payload) {
        created.push(payload);
        const top = {
          id: "new-1",
          project_id: payload.projectId,
          parent_top_id: payload.parentTopId ?? null,
          level: payload.level,
          number: payload.number,
          title: payload.title,
        };
        tops.set(top.id, top);
        return top;
      },
    };
    const meetingsRepo = {
      getMeetingById(id) {
        return { id, project_id: "p1", is_closed: 0 };
      },
    };
    const meetingTopsRepo = {
      attachTopToMeeting() {
        return { id: "new-1" };
      },
    };

    const service = createTopService({ topsRepo, meetingsRepo, meetingTopsRepo });
    const createdTop = service.createTop({
      projectId: "p1",
      meetingId: "m1",
      parentTopId: "1",
      level: 1,
      title: "Kind",
    });

    assert.equal(created.length, 1);
    assert.equal(created[0].parentTopId, "1");
    assert.equal(created[0].level, 2);
    assert.equal(created[0].number, 1);
    assert.equal(createdTop.parent_top_id, "1");
    assert.equal(createdTop.level, 2);
  });

  await run("TopService: Root-TOPs bleiben Level 1 und ohne Parent", () => {
    const topsRepo = {
      getNextNumber(projectId, parentTopId) {
        assert.equal(projectId, "p1");
        assert.equal(parentTopId, null);
        return 1;
      },
      getTopById() {
        return null;
      },
      createTop(payload) {
        return {
          id: "root-1",
          project_id: payload.projectId,
          parent_top_id: payload.parentTopId ?? null,
          level: payload.level,
          number: payload.number,
          title: payload.title,
        };
      },
    };
    const meetingsRepo = {
      getMeetingById(id) {
        return { id, project_id: "p1", is_closed: 0 };
      },
    };
    const meetingTopsRepo = {
      attachTopToMeeting() {
        return { id: "root-1" };
      },
    };

    const service = createTopService({ topsRepo, meetingsRepo, meetingTopsRepo });
    const createdTop = service.createTop({
      projectId: "p1",
      meetingId: "m1",
      parentTopId: null,
      level: 1,
      title: "Titel 1",
    });

    assert.equal(createdTop.parent_top_id, null);
    assert.equal(createdTop.level, 1);
  });

  await run("TopService: erledigt setzt completed_in_meeting_id und loescht es beim Rueckwechsel", () => {
    const updateCalls = [];
    const topsRepo = {
      getTopById(topId) {
        return { id: topId, project_id: "p1" };
      },
    };
    const meetingsRepo = {
      getMeetingById(id) {
        return { id, project_id: "p1", is_closed: 0 };
      },
    };
    const meetingTopsRepo = {
      getMeetingTop(meetingId, topId) {
        return {
          meeting_id: meetingId,
          top_id: topId,
          status: "offen",
          due_date: null,
          longtext: "",
          is_carried_over: 0,
          completed_in_meeting_id: null,
        };
      },
      updateMeetingTop(payload) {
        updateCalls.push(payload);
        return { changed: 1, row: { ...payload } };
      },
    };

    const service = createTopService({ topsRepo, meetingsRepo, meetingTopsRepo });
    service.updateMeetingFields({
      meetingId: "m-1",
      topId: "t-1",
      patch: { status: "erledigt" },
    });
    service.updateMeetingFields({
      meetingId: "m-1",
      topId: "t-1",
      patch: { status: "in arbeit" },
    });

    assert.equal(updateCalls.length, 2);
    assert.equal(updateCalls[0].completed_in_meeting_id, "m-1");
    assert.equal(updateCalls[1].completed_in_meeting_id, null);
  });

  await run("meetingTopsRepo: erledigte TOPs werden nur im direkten Folgeprotokoll uebernommen", () => {
    withMockedMeetingTopsRepo((repo) => {
      repo.attachTopToMeeting({
        meetingId: "P2",
        topId: "done-1",
        status: "erledigt",
        completed_in_meeting_id: "P2",
      });
      repo.attachTopToMeeting({
        meetingId: "P2",
        topId: "open-1",
        status: "offen",
      });

      const firstCarry = repo.carryOverFromMeeting("P2", "P3");
      assert.equal(firstCarry.inserted, 2);

      const carriedDone = repo.getMeetingTop("P3", "done-1");
      const carriedOpen = repo.getMeetingTop("P3", "open-1");
      assert.equal(carriedDone.status, "erledigt");
      assert.equal(carriedDone.completed_in_meeting_id, "P2");
      assert.equal(carriedOpen.status, "offen");

      const secondCarry = repo.carryOverFromMeeting("P3", "P4");
      assert.equal(secondCarry.inserted, 1);
      assert.equal(repo.getMeetingTop("P4", "done-1"), undefined);
      assert.equal(repo.getMeetingTop("P4", "open-1").status, "offen");
    });
  });
}

module.exports = { runTopServiceHierarchyTests };
