"use strict";
const { randomUUID } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const { enforceLicensedFeature } = require("../../licensing/featureGuard");
const { getPrintRuntimeContext } = require("../../print/printData");
const { createPreNotificationService } = require("./PreNotificationService");
const { buildPreNotificationSnapshot } = require("../../../shared/sigeko/preNotificationSnapshots.cjs");

function fail(code, message) { throw Object.assign(new Error(message), { code }); }
// Main-only capture boundary. No IPC, persistence, output file or process status.
// The later document workflow owns rendering and commits only successful output.
function createPreNotificationSnapshotService({ drafts = createPreNotificationService(),
  runtime = getPrintRuntimeContext, enforce = enforceLicensedFeature,
  uuid = randomUUID, clock = () => new Date().toISOString() } = {}) {
  return Object.freeze({
    async capture(payload) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
          ![Object.prototype, null].includes(Object.getPrototypeOf(payload)) ||
          Reflect.ownKeys(payload).length !== 2 || !Object.hasOwn(payload, "projectId") ||
          !Object.hasOwn(payload, "expectedRevision") || typeof payload.projectId !== "string" ||
          !payload.projectId.trim() || payload.projectId !== payload.projectId.trim() ||
          !Number.isSafeInteger(payload.expectedRevision) || payload.expectedRevision < 0) {
        fail("INVALID_INPUT", "Projekt-ID und gelesene Entwurfsrevision erforderlich.");
      }
      const { projectId, expectedRevision } = payload;
      enforce("sigeko");
      // Validate existence/revision before the asynchronous shared header read.
      const before = drafts.getPreNotification({ projectId });
      if ((before.record?.revision || 0) !== expectedRevision) {
        fail("PRE_NOTIFICATION_CONFLICT", "Vorankündigung wurde inzwischen geändert. Bitte erneut laden.");
      }
      const context = await runtime({ mode: "provider", projectId, orientation: "portrait" });
      enforce("sigeko");
      const data = drafts.getPreNotification({ projectId });
      if ((data.record?.revision || 0) !== expectedRevision || (data.record?.id || null) !== (before.record?.id || null)) {
        fail("PRE_NOTIFICATION_CONFLICT", "Vorankündigung wurde inzwischen geändert. Bitte erneut laden.");
      }
      if (!context?.project || context.project.id !== projectId ||
          !isDeepStrictEqual(context.project, data.central.project)) {
        fail("PRE_NOTIFICATION_SOURCE_CHANGED", "Projekt wurde während der Druckvorbereitung geändert. Bitte erneut laden.");
      }
      return buildPreNotificationSnapshot({ data, runtimeContext: context, documentId: uuid(), createdAt: clock() });
    },
  });
}
module.exports = Object.freeze({ createPreNotificationSnapshotService });
