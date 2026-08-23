"use strict";

const { initDatabase } = require("../../db/database");
const firmsRepo = require("../../db/firmsRepo");
const projectFirmsRepo = require("../../db/projectFirmsRepo");
const firmUsagesRepo = require("../../db/firmUsagesRepo");
const {
  FIRM_KINDS,
  defaultsForCreation,
  firmRefKey,
  normalizeFirmRef,
  normalizeUses,
} = require("./firmReference");

const FIRM_FIELDS = new Set([
  "short",
  "name",
  "name2",
  "street",
  "zip",
  "city",
  "phone",
  "email",
  "gewerk",
  "notes",
  "role_code",
]);

function labelFor(row) {
  return String(row?.short || row?.name || "(ohne Name)").trim();
}

function toDirectoryEntry(row, kind, usageCodes = null) {
  if (!row) return null;
  const projectId = kind === FIRM_KINDS.PROJECT ? String(row.project_id || "") || null : null;
  const label = labelFor(row);
  const ref = Object.freeze({ kind, id: String(row.id), projectId, label });
  return Object.freeze({
    ...row,
    kind,
    ref,
    key: firmRefKey(ref),
    label,
    uses: Object.freeze({
      projectParticipant: Array.isArray(usageCodes)
        ? Number(usageCodes.includes(firmUsagesRepo.FIRM_USAGE_CODES.PROJECT_PARTICIPANT))
        : Number(row.use_project_participant) === 1 ? 1 : 0,
      customer: Array.isArray(usageCodes)
        ? Number(usageCodes.includes(firmUsagesRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER))
        : Number(row.use_customer) === 1 ? 1 : 0,
    }),
    is_active: Number(row.is_active ?? 1) === 1 ? 1 : 0,
  });
}

function cleanPatch(patch) {
  const source = patch && typeof patch === "object" ? patch : {};
  return Object.fromEntries(Object.entries(source).filter(([key]) => FIRM_FIELDS.has(key)));
}

class FirmDirectoryService {
  constructor({
    dbProvider = initDatabase,
    globalRepo = firmsRepo,
    projectRepo = projectFirmsRepo,
    usageRepo = firmUsagesRepo,
    customerImpactProvider = null,
  } = {}) {
    this.dbProvider = dbProvider;
    this.globalRepo = globalRepo;
    this.projectRepo = projectRepo;
    this.usageRepo = usageRepo;
    this.customerImpactProvider =
      typeof customerImpactProvider === "function" ? customerImpactProvider : null;
  }

  _db() {
    return this.dbProvider();
  }

  get(refInput) {
    const ref = normalizeFirmRef(refInput, { projectId: refInput?.projectId || refInput?.project_id });
    const db = this._db();
    const row =
      ref.kind === FIRM_KINDS.GLOBAL
        ? db.prepare("SELECT * FROM firms WHERE id = ?").get(ref.id)
        : db
            .prepare("SELECT * FROM project_firms WHERE id = ? AND project_id = ?")
            .get(ref.id, ref.projectId);
    const usages = row && ref.kind === FIRM_KINDS.GLOBAL
      ? this.usageRepo.listCodesByFirm(row.id, db)
      : null;
    return toDirectoryEntry(row, ref.kind, usages);
  }

  listAll({ kind, projectId, includeInactive = true } = {}) {
    const db = this._db();
    if (kind === FIRM_KINDS.GLOBAL) {
      return db
        .prepare(
          `SELECT * FROM firms
           WHERE removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
           ORDER BY COALESCE(role_code, 60), LOWER(COALESCE(short, name, ''))`
        )
        .all()
        .map((row) => toDirectoryEntry(
          row,
          FIRM_KINDS.GLOBAL,
          this.usageRepo.listCodesByFirm(row.id, db)
        ));
    }
    const pid = String(projectId || "").trim();
    if (!pid) throw new Error("projectId required");
    const activeWhere = includeInactive ? "" : "AND COALESCE(is_active, 1) = 1";
    return db
      .prepare(
        `SELECT * FROM project_firms
         WHERE project_id = ? AND removed_at IS NULL ${activeWhere}
         ORDER BY COALESCE(role_code, 60), LOWER(COALESCE(short, name, ''))`
      )
      .all(pid)
      .map((row) => toDirectoryEntry(row, FIRM_KINDS.PROJECT));
  }

  listProjectParticipants({ projectId, includeInactive = false } = {}) {
    const pid = String(projectId || "").trim();
    if (!pid) throw new Error("projectId required");
    const activeWhere = includeInactive ? "" : "AND COALESCE(pf.is_active, 1) = 1";
    const assignmentActiveWhere = includeInactive ? "" : "AND COALESCE(pgf.is_active, 1) = 1";
    const db = this._db();
    const locals = db
      .prepare(
        `SELECT pf.* FROM project_firms pf
         WHERE pf.project_id = ? AND pf.removed_at IS NULL
           AND pf.use_project_participant = 1 ${activeWhere}`
      )
      .all(pid)
      .map((row) => toDirectoryEntry(row, FIRM_KINDS.PROJECT));
    const globals = db
      .prepare(
        `SELECT f.*, pgf.is_active AS is_active, pgf.project_id AS assigned_project_id
         FROM project_global_firms pgf
         JOIN firms f ON f.id = pgf.firm_id
         WHERE pgf.project_id = ? AND pgf.removed_at IS NULL ${assignmentActiveWhere}
           AND f.removed_at IS NULL AND COALESCE(f.is_trashed, 0) = 0
           AND f.use_project_participant = 1`
      )
      .all(pid)
      .map((row) => toDirectoryEntry(row, FIRM_KINDS.GLOBAL));
    return [...locals, ...globals].sort((a, b) => a.label.localeCompare(b.label, "de"));
  }

  listCustomers() {
    const db = this._db();
    const usageCode = this.usageRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER;
    return this.usageRepo
      .listFirmsByUsage(usageCode, db)
      .map((row) => toDirectoryEntry(row, FIRM_KINDS.GLOBAL, this.usageRepo.listCodesByFirm(row.id, db)))
      .sort((a, b) => a.label.localeCompare(b.label, "de"));
  }

  listPersons({ ref: refInput, projectId, forUse = null, participantOnly = false } = {}) {
    const ref = normalizeFirmRef(refInput, {
      projectId: refInput?.projectId || refInput?.project_id || projectId,
    });
    const firm = this.get(ref);
    if (!firm) throw new Error("firm not found");
    const participantUse = participantOnly === true || forUse === "project_participant";
    if (participantUse && firm.uses.projectParticipant !== 1) return [];
    if (participantUse && ref.kind === FIRM_KINDS.PROJECT && firm.is_active !== 1) return [];
    const db = this._db();
    if (ref.kind === FIRM_KINDS.GLOBAL) {
      if (participantUse && ref.projectId) {
        const assigned = db
          .prepare(
            `SELECT 1 FROM project_global_firms
             WHERE project_id = ? AND firm_id = ? AND removed_at IS NULL AND COALESCE(is_active, 1) = 1`
          )
          .get(ref.projectId, ref.id);
        if (!assigned) return [];
      }
      return db
        .prepare(
          `SELECT *, 'global_person' AS kind FROM persons
           WHERE firm_id = ? AND removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
           ORDER BY LOWER(COALESCE(name, ''))`
        )
        .all(ref.id);
    }
    return db
      .prepare(
        `SELECT *, 'project_person' AS kind FROM project_persons
         WHERE project_firm_id = ? AND removed_at IS NULL
         ORDER BY LOWER(COALESCE(name, ''))`
      )
      .all(ref.id);
  }

  create({ kind, projectId, origin, data = {}, uses } = {}) {
    const defaults = defaultsForCreation({ origin, kind, projectId });
    const resolvedUses = normalizeUses(uses, defaults.uses);
    const payload = {
      ...cleanPatch(data),
      use_project_participant: resolvedUses.projectParticipant,
      use_customer: resolvedUses.customer,
    };
    const row = defaults.kind === FIRM_KINDS.GLOBAL
      ? this.globalRepo.createFirm(payload)
      : this.projectRepo.createProjectFirm({ ...payload, projectId: String(projectId).trim() });
    if (defaults.kind === FIRM_KINDS.GLOBAL) {
      const usageCodes = [];
      if (resolvedUses.projectParticipant) usageCodes.push(this.usageRepo.FIRM_USAGE_CODES.PROJECT_PARTICIPANT);
      if (resolvedUses.customer) usageCodes.push(this.usageRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER);
      this.usageRepo.replaceUsages({ firmId: row.id, usageCodes, dbConn: this._db() });
      return this.get({ kind: FIRM_KINDS.GLOBAL, id: row.id });
    }
    return toDirectoryEntry(row, defaults.kind);
  }

  update({ ref: refInput, patch } = {}) {
    const ref = normalizeFirmRef(refInput, { projectId: refInput?.projectId || refInput?.project_id });
    const safePatch = cleanPatch(patch);
    const current = this.get(ref);
    if (!current) throw new Error("firm not found");
    const row =
      ref.kind === FIRM_KINDS.GLOBAL
        ? this.globalRepo.updateFirm({ firmId: ref.id, patch: safePatch })
        : this.projectRepo.updateProjectFirm({ projectFirmId: ref.id, patch: safePatch });
    return toDirectoryEntry(row, ref.kind);
  }

  checkUseChange({ ref: refInput, uses } = {}) {
    const ref = normalizeFirmRef(refInput, { projectId: refInput?.projectId || refInput?.project_id });
    const current = this.get(ref);
    if (!current) throw new Error("firm not found");
    const next = normalizeUses(uses, current.uses);
    const impacts = [];
    if (current.uses.projectParticipant === 1 && next.projectParticipant === 0) {
      impacts.push(...this._participantImpacts(ref));
    }
    if (current.uses.customer === 1 && next.customer === 0) {
      impacts.push(...this._customerImpacts(ref));
    }
    return Object.freeze({ allowed: impacts.length === 0, current: current.uses, next, impacts });
  }

  _participantImpacts(ref) {
    const db = this._db();
    const impacts = [];
    const add = (code, label, count) => {
      const n = Number(count || 0);
      if (n > 0) impacts.push(Object.freeze({ code, label, count: n }));
    };

    if (ref.kind === FIRM_KINDS.GLOBAL) {
      add(
        "active_project_assignments",
        "Aktive Projektzuordnungen",
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM project_global_firms
             WHERE firm_id = ? AND removed_at IS NULL AND COALESCE(is_active, 1) = 1`
          )
          .get(ref.id)?.n
      );
      add(
        "active_persons",
        "Aktive Mitarbeiter",
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM persons
             WHERE firm_id = ? AND removed_at IS NULL AND COALESCE(is_trashed, 0) = 0`
          )
          .get(ref.id)?.n
      );
      add(
        "open_meeting_participants",
        "Teilnehmer in offenen Besprechungen",
        db
          .prepare(
            `SELECT COUNT(*) AS n
             FROM meeting_participants mp
             JOIN meetings m ON m.id = mp.meeting_id AND m.is_closed = 0
             JOIN persons p ON mp.kind = 'global_person' AND p.id = mp.person_id
             WHERE p.firm_id = ? AND p.removed_at IS NULL AND COALESCE(p.is_trashed, 0) = 0`
          )
          .get(ref.id)?.n
      );
      add(
        "active_candidates",
        "Aktive Projektkandidaten",
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM project_candidates pc
             JOIN persons p ON p.id = pc.person_id
             WHERE pc.kind = 'global_person' AND pc.is_active = 1 AND p.firm_id = ?`
          )
          .get(ref.id)?.n
      );
    } else {
      add(
        "active_persons",
        "Aktive Projektmitarbeiter",
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM project_persons
             WHERE project_firm_id = ? AND removed_at IS NULL`
          )
          .get(ref.id)?.n
      );
      add(
        "open_meeting_participants",
        "Teilnehmer in offenen Besprechungen",
        db
          .prepare(
            `SELECT COUNT(*) AS n
             FROM meeting_participants mp
             JOIN meetings m ON m.id = mp.meeting_id AND m.is_closed = 0
             JOIN project_persons p ON mp.kind = 'project_person' AND p.id = mp.person_id
             WHERE p.project_firm_id = ? AND p.removed_at IS NULL`
          )
          .get(ref.id)?.n
      );
      add(
        "active_candidates",
        "Aktive Projektkandidaten",
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM project_candidates pc
             JOIN project_persons pp ON pp.id = pc.person_id
             WHERE pc.kind = 'project_person' AND pc.is_active = 1 AND pp.project_firm_id = ?`
          )
          .get(ref.id)?.n
      );
    }

    add(
      "open_top_responsibilities",
      "Verantwortliche in offenen Besprechungen",
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM meeting_tops mt
           JOIN meetings m ON m.id = mt.meeting_id
           WHERE COALESCE(m.is_closed, 0) = 0 AND mt.responsible_kind = ? AND mt.responsible_id = ?`
        )
        .get(ref.kind, ref.id)?.n
    );
    const restColumn =
      ref.kind === FIRM_KINDS.GLOBAL ? "responsible_global_firm_id" : "responsible_project_firm_id";
    add(
      "open_restarbeiten",
      "Offene Restarbeiten",
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM restarbeiten_items
           WHERE ${restColumn} = ? AND deleted_at IS NULL AND archived_at IS NULL AND status <> 'erledigt'`
        )
        .get(ref.id)?.n
    );
    return impacts;
  }

  _customerImpacts(ref) {
    // Extension point for the productive invoice module. Draft/open invoice
    // references can be supplied without importing that optional module here.
    const result = this.customerImpactProvider ? this.customerImpactProvider({ ref }) : [];
    return Array.isArray(result) ? result.filter((entry) => Number(entry?.count || 0) > 0) : [];
  }

  setUses({ ref: refInput, uses, expectedUpdatedAt } = {}) {
    const ref = normalizeFirmRef(refInput, { projectId: refInput?.projectId || refInput?.project_id });
    const db = this._db();
    const transaction = db.transaction(() => {
      const assessment = this.checkUseChange({ ref, uses });
      if (!assessment.allowed) {
        const error = new Error("Verwendung kann wegen aktiver Referenzen nicht deaktiviert werden.");
        error.code = "FIRM_USE_BLOCKED";
        error.impacts = assessment.impacts;
        throw error;
      }
      if (ref.kind === FIRM_KINDS.GLOBAL) {
        const usageCodes = [];
        if (assessment.next.projectParticipant) usageCodes.push(this.usageRepo.FIRM_USAGE_CODES.PROJECT_PARTICIPANT);
        if (assessment.next.customer) usageCodes.push(this.usageRepo.FIRM_USAGE_CODES.INVOICE_CUSTOMER);
        const versionedCurrent = this.get(ref);
        if (expectedUpdatedAt && versionedCurrent?.updated_at !== expectedUpdatedAt) {
          const error = new Error("Firma wurde zwischenzeitlich geaendert.");
          error.code = "FIRM_VERSION_CONFLICT";
          throw error;
        }
        this.usageRepo.replaceUsages({ firmId: ref.id, usageCodes, dbConn: db });
        return this.get(ref);
      }
      const table = "project_firms";
      const scopeSql = ref.kind === FIRM_KINDS.PROJECT ? " AND project_id = @project_id" : "";
      const versionSql = expectedUpdatedAt ? " AND updated_at = @expected_updated_at" : "";
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `UPDATE ${table}
           SET use_project_participant = @participant, use_customer = @customer, updated_at = @updated_at
           WHERE id = @id${scopeSql}${versionSql}`
        )
        .run({
          id: ref.id,
          project_id: ref.projectId,
          participant: assessment.next.projectParticipant,
          customer: assessment.next.customer,
          updated_at: now,
          expected_updated_at: expectedUpdatedAt || null,
        });
      if (Number(result.changes || 0) !== 1) {
        const error = new Error(expectedUpdatedAt ? "Firma wurde zwischenzeitlich geaendert." : "firm not found");
        error.code = expectedUpdatedAt ? "FIRM_VERSION_CONFLICT" : "FIRM_NOT_FOUND";
        throw error;
      }
      return this.get(ref);
    });
    return transaction();
  }

  prepareLocalToGlobal({ ref: refInput } = {}) {
    const ref = normalizeFirmRef(refInput, { projectId: refInput?.projectId || refInput?.project_id });
    if (ref.kind !== FIRM_KINDS.PROJECT) throw new Error("project_firm required");
    const source = this.get(ref);
    if (!source) throw new Error("firm not found");
    const db = this._db();
    const matches = db
      .prepare(
        `SELECT id, short, name FROM firms
         WHERE removed_at IS NULL AND COALESCE(is_trashed, 0) = 0
           AND LOWER(TRIM(name)) = LOWER(TRIM(?))`
      )
      .all(source.name);
    return Object.freeze({
      executable: false,
      boundary: "local_to_global_preparation_v1",
      source,
      matchingGlobalFirms: matches.map((row) => toDirectoryEntry(row, FIRM_KINDS.GLOBAL)),
      requiredDecisions: Object.freeze(["target_global_firm", "person_merge", "reference_rewrite"]),
    });
  }
}

let singleton = null;

function getFirmDirectoryService() {
  if (!singleton) singleton = new FirmDirectoryService();
  return singleton;
}

module.exports = { FirmDirectoryService, getFirmDirectoryService, toDirectoryEntry };
