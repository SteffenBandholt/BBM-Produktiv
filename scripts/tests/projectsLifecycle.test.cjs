const assert = require("node:assert/strict");
const Module = require("node:module");

function createFakeProjectsDb() {
  const columns = [
    "id",
    "project_number",
    "name",
    "short",
    "street",
    "zip",
    "city",
    "project_lead",
    "project_lead_phone",
    "start_date",
    "end_date",
    "notes",
    "archived_at",
  ];

  const state = { projects: [] };

  function clone(row) {
    return row ? { ...row } : row;
  }

  function normalizeNumber(value) {
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function sortByProjectNumberAndName(rows) {
    return [...rows].sort((a, b) => {
      const aMissing = normalizeNumber(a.project_number) === "";
      const bMissing = normalizeNumber(b.project_number) === "";
      if (aMissing !== bMissing) return aMissing ? 1 : -1;

      const aNumber = normalizeNumber(a.project_number).toLowerCase();
      const bNumber = normalizeNumber(b.project_number).toLowerCase();
      if (aNumber !== bNumber) return aNumber < bNumber ? -1 : 1;

      const aName = String(a.name || "").toLowerCase();
      const bName = String(b.name || "").toLowerCase();
      if (aName !== bName) return aName < bName ? -1 : 1;

      return 0;
    });
  }

  function sortByArchivedAtAndName(rows) {
    return [...rows].sort((a, b) => {
      const aArchived = String(a.archived_at || "");
      const bArchived = String(b.archived_at || "");
      if (aArchived !== bArchived) return aArchived < bArchived ? 1 : -1;

      const aName = String(a.name || "").toLowerCase();
      const bName = String(b.name || "").toLowerCase();
      if (aName !== bName) return aName < bName ? -1 : 1;

      return 0;
    });
  }

  function findProject(projectId) {
    return state.projects.find((row) => String(row.id) === String(projectId));
  }

  function rowsForQuery(sql, params) {
    if (/WHERE\s+id\s*=\s*\?/i.test(sql)) {
      const row = findProject(params[0]);
      return row ? [clone(row)] : [];
    }

    if (/WHERE\s+archived_at\s+IS\s+NULL/i.test(sql)) {
      return sortByProjectNumberAndName(
        state.projects.filter((row) => row.archived_at === null || row.archived_at === undefined)
      ).map(clone);
    }

    if (/WHERE\s+archived_at\s+IS\s+NOT\s+NULL/i.test(sql)) {
      return sortByArchivedAtAndName(
        state.projects.filter((row) => row.archived_at !== null && row.archived_at !== undefined)
      ).map(clone);
    }

    return state.projects.map(clone);
  }

  function insertProject(sql, params) {
    const match = sql.match(/INSERT\s+INTO\s+projects\s*\(([\s\S]+?)\)\s*VALUES/i);
    if (!match) throw new Error(`Unsupported INSERT: ${sql}`);

    const cols = match[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const row = {};
    cols.forEach((col, index) => {
      row[col] = params[index];
    });

    for (const col of columns) {
      if (!Object.prototype.hasOwnProperty.call(row, col)) {
        row[col] = null;
      }
    }

    state.projects.push(row);
    return { changes: 1, lastInsertRowid: row.id };
  }

  function updateProject(sql, params) {
    const match = sql.match(/SET\s+([\s\S]+?)\s+WHERE\s+id\s*=\s*\?/i);
    if (!match) throw new Error(`Unsupported UPDATE: ${sql}`);

    const assignments = match[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const values = [];
    let paramIndex = 0;
    assignments.forEach((assignment) => {
      const [fieldRaw, rhsRaw] = assignment.split("=");
      const field = fieldRaw.trim();
      const rhs = String(rhsRaw || "").trim();
      if (/^NULL$/i.test(rhs)) {
        values.push(null);
        return;
      }
      if (rhs === "?") {
        values.push(params[paramIndex]);
        paramIndex += 1;
        return;
      }
      values.push(rhs);
    });

    const projectId = params[paramIndex];
    const row = findProject(projectId);
    if (!row) return { changes: 0 };

    assignments.forEach((assignment, index) => {
      const field = assignment.split("=")[0].trim();
      row[field] = values[index];
    });

    return { changes: 1 };
  }

  function deleteProject(params) {
    const projectId = params[0];
    const before = state.projects.length;
    state.projects = state.projects.filter((row) => String(row.id) !== String(projectId));
    return { changes: before - state.projects.length };
  }

  const db = {
    state,
    exec() {},
    close() {},
    transaction(fn) {
      return (...args) => fn(...args);
    },
    prepare(sql) {
      const normalized = String(sql || "").replace(/\s+/g, " ").trim();

      return {
        get(...params) {
          if (/SELECT name FROM sqlite_master WHERE type='table' AND name=\?/i.test(normalized)) {
            return params[0] === "projects" ? { name: "projects" } : undefined;
          }

          if (/^PRAGMA table_info\(projects\)$/i.test(normalized)) {
            return undefined;
          }

          if (/FROM projects/i.test(normalized)) {
            return rowsForQuery(normalized, params)[0];
          }

          throw new Error(`Unsupported get() SQL: ${normalized}`);
        },
        all(...params) {
          if (/SELECT name FROM sqlite_master WHERE type='table' AND name=\?/i.test(normalized)) {
            return params[0] === "projects" ? [{ name: "projects" }] : [];
          }

          if (/^PRAGMA table_info\(projects\)$/i.test(normalized)) {
            return columns.map((name, index) => ({ cid: index, name }));
          }

          if (/FROM projects/i.test(normalized)) {
            return rowsForQuery(normalized, params);
          }

          throw new Error(`Unsupported all() SQL: ${normalized}`);
        },
        run(...params) {
          if (/^INSERT INTO projects/i.test(normalized)) {
            return insertProject(normalized, params);
          }

          if (/^UPDATE projects SET/i.test(normalized)) {
            return updateProject(normalized, params);
          }

          if (/^DELETE FROM projects WHERE id = \?/i.test(normalized)) {
            return deleteProject(params);
          }

          if (/^ALTER TABLE projects ADD COLUMN/i.test(normalized)) {
            return { changes: 0 };
          }

          throw new Error(`Unsupported run() SQL: ${normalized}`);
        },
      };
    },
  };

  return db;
}

function loadProjectsRepo() {
  const projectRepoPath = require.resolve("../../src/main/db/projectsRepo");
  delete require.cache[projectRepoPath];

  const fakeDb = createFakeProjectsDb();
  const originalLoad = Module._load;

  Module._load = function patchedLoad(request, parent, isMain) {
    const parentFile = String(parent?.filename || "").replace(/\\/g, "/");
    if (request === "./database" && parentFile.endsWith("/src/main/db/projectsRepo.js")) {
      return {
        initDatabase: () => fakeDb,
        closeDatabase: () => {},
      };
    }

    return originalLoad.apply(this, arguments);
  };

  try {
    const projectsRepo = require(projectRepoPath);
    return { projectsRepo, fakeDb };
  } finally {
    Module._load = originalLoad;
  }
}

async function runProjectsLifecycleTests(run) {
  const { projectsRepo, fakeDb } = loadProjectsRepo();

  function resetDb() {
    fakeDb.state.projects = [];
  }

  await run("ProjectsRepo: createProject und getById liefern den neuen Datensatz", () => {
    resetDb();

    const created = projectsRepo.createProject({
      project_number: "20",
      name: "Nord",
      short: "N",
      city: "Berlin",
    });

    assert.equal(created.name, "Nord");
    assert.equal(created.project_number, "20");
    assert.equal(created.projectNumber, "20");
    assert.equal(created.archived_at, null);
    assert.equal(created.archivedAt, null);

    const fetched = projectsRepo.getById(created.id);
    assert.equal(fetched.id, created.id);
    assert.equal(fetched.name, "Nord");
    assert.equal(fetched.project_number, "20");
  });

  await run("ProjectsRepo: listAll sortiert aktive Projekte und listet nur nicht archivierte", () => {
    resetDb();

    const archived = projectsRepo.createProject({ project_number: "20", name: "Archiviert" });
    const alpha = projectsRepo.createProject({ project_number: "10", name: "Alpha" });
    const beta = projectsRepo.createProject({ name: "Ohne Nummer" });

    projectsRepo.archiveProject(archived.id);

    const active = projectsRepo.listAll();
    const archivedList = projectsRepo.listArchived();

    assert.deepEqual(
      active.map((row) => ({ id: row.id, name: row.name, project_number: row.project_number })),
      [
        { id: alpha.id, name: "Alpha", project_number: "10" },
        { id: beta.id, name: "Ohne Nummer", project_number: null },
      ]
    );

    assert.deepEqual(
      archivedList.map((row) => ({ id: row.id, name: row.name, archived_at: row.archived_at })),
      [
        {
          id: archived.id,
          name: "Archiviert",
          archived_at: archivedList[0].archived_at,
        },
      ]
    );
  });

  await run("ProjectsRepo: archiveProject und unarchiveProject verschieben den Status", () => {
    resetDb();

    const project = projectsRepo.createProject({ name: "Status Test" });

    const archived = projectsRepo.archiveProject(project.id);
    assert.equal(archived.id, project.id);
    assert.equal(typeof archived.archived_at, "string");
    assert.equal(projectsRepo.listAll().length, 0);
    assert.equal(projectsRepo.listArchived().length, 1);

    const restored = projectsRepo.unarchiveProject(project.id);
    assert.equal(restored.id, project.id);
    assert.equal(restored.archived_at, null);
    assert.equal(projectsRepo.listAll().length, 1);
    assert.equal(projectsRepo.listArchived().length, 0);
  });

  await run("ProjectsRepo: unbekannte Projekt-IDs bleiben defensiv", () => {
    resetDb();

    const missing = projectsRepo.getById("missing");
    const archived = projectsRepo.archiveProject("missing");
    const restored = projectsRepo.unarchiveProject("missing");

    assert.equal(missing, undefined);
    assert.equal(archived, undefined);
    assert.equal(restored, undefined);
  });
}

module.exports = { runProjectsLifecycleTests };
