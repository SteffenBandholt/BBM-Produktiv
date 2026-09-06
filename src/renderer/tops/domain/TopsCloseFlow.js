import { MailFlow } from "../../features/mail/MailFlow.js";
import { PdfDocumentService } from "../../features/output/PdfDocumentService.js";

const CLOSE_PDF_OUTPUTS = Object.freeze([
  Object.freeze({
    key: "protocol",
    operation: "printClosedMeetingDirect",
    errorLabel: "Protokoll-PDF",
  }),
  Object.freeze({ key: "firms", operation: "printFirmsDirect", errorLabel: "Firmenliste-PDF" }),
  Object.freeze({ key: "todo", operation: "printTodoDirect", errorLabel: "ToDo-PDF" }),
  Object.freeze({ key: "tops", operation: "printTopListAllDirect", errorLabel: "Top-Liste-PDF" }),
]);

// Fachmodul `Protokoll`:
// Abschluss- und Ausgabeablauf des Protokolls; Mail/Print bleiben gemeinsame Dienste.
export class TopsCloseFlow {
  constructor(options = {}) {
    this.router = options.router || null;
    this.projectId = options.projectId || null;
    this.meetingId = options.meetingId || null;
    this.meetingMeta = null;
    this.isReadOnly = false;
    this.showAmpelInList = true;
    this._lastClosedMeetingForEmail = null;
    this.pdfDocumentService =
      options.pdfDocumentService || new PdfDocumentService({ router: this.router });

    this._mailViewAdapter = {
      get projectId() {
        return this._owner.projectId;
      },
      get meetingId() {
        return this._owner.meetingId;
      },
      get meetingMeta() {
        return this._owner.meetingMeta;
      },
      _enterIdleAfterClose: async () => {
        // TopsScreen steuert den Zustand nach run() selbst per Reload/Sync.
      },
      getSelectedClosedMeetingForEmail: () => this.getSelectedClosedMeetingForEmail(),
      _owner: this,
    };

    // Gemeinsamer Dienst / Addon:
    // MailFlow bleibt ausserhalb des Moduls und wird hier nur fachlich angestossen.
    this.mailFlow = new MailFlow({
      view: this._mailViewAdapter,
      router: this.router,
    });
  }

  setContext({ projectId, meetingId, meetingMeta, isReadOnly } = {}) {
    this.projectId = projectId ?? this.projectId ?? null;
    this.meetingId = meetingId ?? this.meetingId ?? null;
    this.meetingMeta = meetingMeta || null;
    this.isReadOnly = !!isReadOnly;
  }

  _computeNextMeetingDefaultDateIso() {
    const m = this.meetingMeta || {};
    const raw =
      m.meeting_date ||
      m.meetingDate ||
      m.date ||
      m.held_on ||
      m.starts_at ||
      m.updated_at ||
      m.updatedAt ||
      "";
    let baseIso = "";

    if (raw) {
      const s = String(raw).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        baseIso = s.slice(0, 10);
      } else {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) {
          baseIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
        }
      }
    }

    if (!baseIso) return "";
    const base = new Date(`${baseIso}T00:00:00`);
    if (Number.isNaN(base.getTime())) return "";
    base.setDate(base.getDate() + 7);
    return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
      base.getDate()
    ).padStart(2, "0")}`;
  }

  _buildClosePayload(nextMeetingInput = {}) {
    return {
      meetingId: this.meetingId,
      pdf_show_ampel: this.showAmpelInList ? 1 : 0,
      nextMeeting: {
        enabled: String(nextMeetingInput["print.nextMeeting.enabled"] ?? "").trim(),
        date: String(nextMeetingInput["print.nextMeeting.date"] || "").trim(),
        time: String(nextMeetingInput["print.nextMeeting.time"] || "").trim(),
        place: String(nextMeetingInput["print.nextMeeting.place"] || "").trim(),
        extra: String(nextMeetingInput["print.nextMeeting.extra"] || "").trim(),
      },
    };
  }

  async _purgeTrashedBeforeClose() {
    try {
      if (typeof window.bbmDb?.topsPurgeTrashedByMeeting === "function") {
        const purgeRes = await window.bbmDb.topsPurgeTrashedByMeeting({
          meetingId: this.meetingId,
        });
        if (purgeRes?.ok === false) {
          console.warn("[tops-v2] purgeTrashedByMeeting failed before close:", purgeRes.error);
        }
      }
    } catch (err) {
      console.warn("[tops-v2] purgeTrashedByMeeting error before close:", err);
    }
  }

  async _printAllOutputs({ projectId, meetingId }) {
    // Das Fachmodul bestimmt Dokumente, Reihenfolge und Fehlertexte. Die technische
    // Ausfuehrung bleibt hinter PdfDocumentService -> Router/PrintModal gemeinsam.
    const printResults = {
      protocol: { ok: false, filePath: "" },
      firms: { ok: false, filePath: "" },
      todo: { ok: false, filePath: "" },
      tops: { ok: false, filePath: "" },
    };

    for (const output of CLOSE_PDF_OUTPUTS) {
      try {
        const result = await this.pdfDocumentService.create({
          operation: output.operation,
          payload: { projectId, meetingId },
        });
        printResults[output.key].ok = result?.ok !== false;
        printResults[output.key].filePath = result?.filePath || result?.path || "";
      } catch (err) {
        console.warn(`[tops-v2] ${output.errorLabel} nach Schliessen fehlgeschlagen:`, err);
        alert(`${output.errorLabel} konnte nach dem Schliessen nicht erzeugt werden.`);
      }
    }

    return printResults;
  }

  async _tryFixNumberGap(gap) {
    if (!gap?.lastTopId) {
      alert("Nummernluecke gefunden, automatische Reparatur ist nicht moeglich.");
      return false;
    }

    const promptText = [
      "Nummernluecke gefunden.",
      `Ebene: ${gap?.level ?? "?"}`,
      `Fehlende Nummer: ${gap?.missingNumber ?? "?"}`,
      "Letzten TOP in die Luecke setzen und erneut versuchen?",
    ].join("\n");

    const accepted = typeof window.confirm === "function" ? window.confirm(promptText) : true;
    if (!accepted) return false;

    if (typeof window.bbmDb?.meetingTopsFixNumberGap !== "function") {
      alert("meetingTopsFixNumberGap ist nicht verfuegbar.");
      return false;
    }

    const fixRes = await window.bbmDb.meetingTopsFixNumberGap({
      meetingId: this.meetingId,
      level: gap?.level,
      parentTopId: gap?.parentTopId ?? null,
      fromTopId: gap?.lastTopId,
      toNumber: gap?.missingNumber,
    });

    if (!fixRes?.ok) {
      alert(fixRes?.error || fixRes?.errorCode || "Reparatur fehlgeschlagen");
      return false;
    }

    return true;
  }

  getSelectedClosedMeetingForEmail() {
    if (this._lastClosedMeetingForEmail && this._lastClosedMeetingForEmail.id) {
      return this._lastClosedMeetingForEmail;
    }
    if (this.meetingMeta && Number(this.meetingMeta.is_closed) === 1) {
      return { ...this.meetingMeta, id: this.meetingId };
    }
    return null;
  }

  async run() {
    if (!this.meetingId) return { ok: false, cancelled: true, error: "meetingId missing" };

    const defDate = this._computeNextMeetingDefaultDateIso();
    const promptRes =
      typeof this.router?.promptNextMeetingSettings === "function"
        ? await this.router.promptNextMeetingSettings({ defaultDateIso: defDate })
        : { cancelled: false, data: {} };

    if (promptRes?.cancelled) return { ok: false, cancelled: true };
    const nextMeetingInput = promptRes?.data || {};
    const closePayload = this._buildClosePayload(nextMeetingInput);

    await this._purgeTrashedBeforeClose();

    if (typeof window.bbmDb?.meetingsClose !== "function") {
      const error = "meetingsClose unavailable";
      alert(error);
      return { ok: false, error };
    }

    const projIdForPrint = this.projectId || this.router?.currentProjectId || null;
    const meetingIdForPrint = this.meetingId;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const res = await window.bbmDb.meetingsClose(closePayload);

      if (res?.ok) {
        if (Array.isArray(res?.warnings) && res.warnings.length > 0) {
          alert(`Hinweis beim Schliessen:\n${res.warnings.join("\n")}`);
        }

        const printResults = await this._printAllOutputs({
          projectId: projIdForPrint,
          meetingId: meetingIdForPrint,
        });

        this._lastClosedMeetingForEmail = res?.meeting
          ? { ...res.meeting, id: res.meeting.id || meetingIdForPrint }
          : { ...(this.meetingMeta || {}), id: meetingIdForPrint };

        const allPrinted =
          printResults.protocol.ok !== false &&
          printResults.firms.ok !== false &&
          printResults.todo.ok !== false &&
          printResults.tops.ok !== false;

        if (allPrinted) {
          await this.mailFlow.maybePromptSendAfterClose({
            printResults,
            meeting: this._lastClosedMeetingForEmail,
          });
        }

        return {
          ok: true,
          meeting: this._lastClosedMeetingForEmail,
          printResults,
        };
      }

      if (res?.errorCode === "NUM_GAP") {
        const gap = (res.gaps || [])[0] || null;
        const fixed = await this._tryFixNumberGap(gap);
        if (fixed) continue;
        return { ok: false, error: "NUM_GAP", gap };
      }

      alert(res?.error || "Schliessen fehlgeschlagen");
      return { ok: false, error: res?.error || "close failed" };
    }

    alert("Schliessen fehlgeschlagen");
    return { ok: false, error: "close failed" };
  }

  async destroy() {
    // Kein externer Zustand zu zerstoeren.
  }
}
