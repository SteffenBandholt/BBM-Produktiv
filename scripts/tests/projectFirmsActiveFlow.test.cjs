const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

function withPatchedLoad(patchFn, fn) {
  const originalLoad = Module._load;
  Module._load = function patched(request, parent, isMain) {
    const replacement = patchFn(request, parent, isMain);
    if (replacement !== undefined) return replacement;
    return originalLoad.apply(this, arguments);
  };
  try {
    return fn();
  } finally {
    Module._load = originalLoad;
  }
}

function createFakeDatabase() {
  const state = {
    projects: [],
    projectFirms: [],
    projectGlobalFirms: [],
    firms: [],
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const nowIso = () => "2025-01-01T00:00:00.000Z";

  function insertProject(args) {
    const [id, name, short] = args;
    state.projects.push({ id, name, short });
    return { changes: 1 };
  }

  function insertProjectFirm(args) {
    const [
      id,
      project_id,
      short,
      name,
      name2,
      street,
      zip,
      city,
      phone,
      email,
      gewerk,
      notes,
      role_code,
      created_at,
      updated_at,
    ] = args;
    state.projectFirms.push({
      id,
      project_id,
      short,
      name,
      name2,
      street,
      zip,
      city,
      phone,
      email,
      gewerk,
      notes,
      role_code,
      removed_at: null,
      created_at,
      updated_at,
      is_active: 1,
    });
    return { changes: 1 };
  }

  function updateProjectFirmActive(args) {
    const [is_active, updated_at, project_id, id] = args;
    const row = state.projectFirms.find((item) => item.project_id === project_id && item.id === id && !item.removed_at);
    if (!row) return { changes: 0 };
    row.is_active = is_active;
    row.updated_at = updated_at;
    return { changes: 1 };
  }

  function updateProjectGlobalFirmActive(args) {
    const [is_active, updated_at, project_id, firm_id] = args;
    const row = state.projectGlobalFirms.find(
      (item) => item.project_id === project_id && item.firm_id === firm_id && !item.removed_at
    );
    if (!row) return { changes: 0 };
    row.is_active = is_active;
    row.updated_at = updated_at;
    return { changes: 1 };
  }

  return {
    state,
    nowIso,
    prepare(sql) {
      const text = String(sql || "");
      return {
        run(...args) {
          if (text.includes("INSERT INTO projects")) return insertProject(args);
          if (text.includes("INSERT INTO project_firms")) return insertProjectFirm(args);
          if (text.includes("UPDATE project_firms") && text.includes("SET is_active")) {
            return updateProjectFirmActive(args);
          }
          if (text.includes("UPDATE project_global_firms") && text.includes("SET is_active")) {
            return updateProjectGlobalFirmActive(args);
          }
          if (text.includes("UPDATE project_global_firms") && text.includes("SET removed_at")) {
            return { changes: 0 };
          }
          return { changes: 0 };
        },
        get(...args) {
          if (text.includes("FROM project_firms") && text.includes("WHERE id = ?")) {
            return clone(state.projectFirms.find((item) => item.id === args[0]) || null);
          }
          if (text.includes("FROM project_firms") && text.includes("WHERE project_id = ?") && text.includes("LIMIT 1")) {
            return clone(
              state.projectFirms.find(
                (item) => item.project_id === args[0] && item.id === args[1] && !item.removed_at
              ) || null
            );
          }
          return null;
        },
        all(...args) {
          if (text.includes("FROM project_firms") && text.includes("WHERE project_id = ?")) {
            const projectId = args[0];
            return state.projectFirms
              .filter((item) => item.project_id === projectId && !item.removed_at)
              .slice()
              .sort((a, b) => {
                const aRole = Number(a.role_code || 60);
                const bRole = Number(b.role_code || 60);
                if (aRole !== bRole) return aRole - bRole;
                const aShort = String(a.short || "").toLowerCase();
                const bShort = String(b.short || "").toLowerCase();
                if (aShort < bShort) return -1;
                if (aShort > bShort) return 1;
                const aName = String(a.name || "").toLowerCase();
                const bName = String(b.name || "").toLowerCase();
                if (aName < bName) return -1;
                if (aName > bName) return 1;
                return 0;
              })
              .map((item) => ({ ...item, is_active: Number(item.is_active ?? 1) }));
          }
          if (text.includes("FROM project_global_firms")) {
            return [];
          }
          return [];
        },
      };
    },
    transaction(fn) {
      return () => fn();
    },
    closeDatabase() {},
  };
}

function loadProjectFirmsRepoWithFakeDatabase(fakeDb) {
  const repoModPath = path.join(process.cwd(), "src/main/db/projectFirmsRepo.js");
  delete require.cache[require.resolve(repoModPath)];

  return withPatchedLoad((request, parent) => {
    const fromRepo = String(parent?.filename || "").endsWith(path.join("db", "projectFirmsRepo.js"));
    if (request === "./database" && fromRepo) {
      return {
        initDatabase: () => fakeDb,
      };
    }
    return undefined;
  }, () => require(repoModPath));
}

async function runProjectFirmsActiveFlowTests(run) {
  await run("Projektfirmen: Aktiv-Haken wird gespeichert und nach Reload wieder geladen", () => {
    const fakeDb = createFakeDatabase();
    const projectFirmsRepo = loadProjectFirmsRepoWithFakeDatabase(fakeDb);

    fakeDb.prepare("INSERT INTO projects (id, name, short) VALUES (?, ?, ?)").run(
      "proj-1",
      "Projekt 1",
      "P1"
    );

    const firm = projectFirmsRepo.createProjectFirm({
      projectId: "proj-1",
      short: "WTB",
      name: "WTB",
    });

    assert.equal(projectFirmsRepo.listActiveByProject("proj-1").length, 1);
    assert.equal(projectFirmsRepo.listActiveByProject("proj-1")[0].id, firm.id);
    assert.equal(projectFirmsRepo.listActiveByProject("proj-1")[0].is_active, 1);

    const inactiveRes = projectFirmsRepo.setProjectFirmActive({
      projectId: "proj-1",
      firmId: firm.id,
      isActive: 0,
    });
    assert.equal(inactiveRes.is_active, 0);
    assert.equal(projectFirmsRepo.listActiveByProject("proj-1").length, 1);
    assert.equal(projectFirmsRepo.listActiveByProject("proj-1")[0].is_active, 0);

    const reloadedRepo = loadProjectFirmsRepoWithFakeDatabase(fakeDb);
    assert.equal(reloadedRepo.listActiveByProject("proj-1").length, 1);
    assert.equal(reloadedRepo.listActiveByProject("proj-1")[0].is_active, 0);

    const activeRes = reloadedRepo.setProjectFirmActive({
      projectId: "proj-1",
      firmId: firm.id,
      isActive: 1,
    });
    assert.equal(activeRes.is_active, 1);
    assert.equal(reloadedRepo.listActiveByProject("proj-1").length, 1);
    assert.equal(reloadedRepo.listActiveByProject("proj-1")[0].id, firm.id);
    assert.equal(reloadedRepo.listActiveByProject("proj-1")[0].is_active, 1);
  });
}

module.exports = { runProjectFirmsActiveFlowTests };
