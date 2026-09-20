// TECH-CONTRACT (verbindlich): docs/UI-TECH-CONTRACT.md
// CONTRACT-VERSION: 1.0.0
// src/main/ipc/meetingsIpc.js

const { ipcMain: electronIpcMain } = require("electron");

const meetingsRepo = require("../db/meetingsRepo");
const meetingTopsRepo = require("../db/meetingTopsRepo");
const { createMeetingService } = require("../domain/MeetingService");

function registerMeetingsIpc({ ipcMain = electronIpcMain } = {}) {
  const meetingService = createMeetingService({ meetingsRepo, meetingTopsRepo });

  ipcMain.handle("meetings:getById", (_e, meetingId) => {
    try { const meeting = meetingsRepo.getMeetingById(meetingId); return meeting ? { ok: true, meeting } : { ok: false, error: "Besprechung nicht gefunden." }; }
    catch (err) { return { ok: false, error: err?.message || String(err) }; }
  });

  ipcMain.handle("meetings:listByProject", (_e, payload) => {
    try {
      const projectId = typeof payload === "string" ? payload : payload?.projectId;
      const list = meetingsRepo.listByProject(projectId, typeof payload === "object" ? payload?.seriesKey : undefined);
      return { ok: true, list };
    } catch (err) {
      return { ok: false, error: err?.stack || err?.message || String(err) };
    }
  });

  ipcMain.handle("meetings:create", (_e, data) => {
    try {
      const meeting = meetingService.createMeeting({
        projectId: data?.projectId,
        seriesKey: data?.seriesKey,
        title: data?.title,
      });
      return { ok: true, meeting };
    } catch (err) {
      console.error("[meetings:create] failed", {
        projectId: data?.projectId ?? null,
        title: data?.title ?? null,
        error: err?.stack || err?.message || String(err),
      });
      return { ok: false, error: err?.stack || err?.message || String(err) };
    }
  });

  ipcMain.handle("meetings:updateNextMeeting", (_e, payload) => {
    try { return { ok: true, meeting: meetingsRepo.updateNextMeeting(payload || {}) }; }
    catch (err) { return { ok: false, error: err?.message || String(err) }; }
  });

  // akzeptiert:
  // - invoke("meetings:close", "<id>")
  // - invoke("meetings:close", { meetingId: "<id>" })
  ipcMain.handle("meetings:close", (_e, payload) => {
    try {
      const res = meetingService.closeMeeting(payload);
      if (res && res.ok === false) return res;
      return { ok: true, ...res };
    } catch (err) {
      return { ok: false, error: err?.stack || err?.message || String(err) };
    }
  });

  ipcMain.handle("meetings:updateTitle", (_e, payload) => {
    try {
      const meetingId = String(payload?.meetingId || payload?.id || "").trim();
      const title = String(payload?.title || "").trim();
      if (!meetingId) return { ok: false, error: "meetingId fehlt" };
      const result = meetingsRepo.updateMeetingTitle({ meetingId, title });
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, error: err?.stack || err?.message || String(err) };
    }
  });

  ipcMain.handle("meetings:listProjectTasks", (_e, payload) => {
    try {
      const d = payload && typeof payload === "object" ? payload : { projectId: payload };
      const projectId = d.projectId ?? d.project_id ?? d.id ?? null;
      if (!projectId) return { ok: false, error: "projectId fehlt" };
      const statusFilter = d.statusFilter ?? d.status ?? null;
      const list = meetingService.listProjectTasks(projectId, statusFilter);
      return { ok: true, list };
    } catch (err) {
      return { ok: false, error: err?.stack || err?.message || String(err) };
    }
  });

  console.log("[main] meetings IPC registered");
}

module.exports = { registerMeetingsIpc };
