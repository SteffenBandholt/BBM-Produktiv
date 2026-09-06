export class ProtokollMailPayloadService {
  constructor({ router, getActiveProjectLabel } = {}) {
    this.router = router || null;
    this.getActiveProjectLabel =
      typeof getActiveProjectLabel === "function" ? getActiveProjectLabel : () => "";
  }

  async getCurrentProjectContext() {
    const projectId = this.router?.currentProjectId || null;
    const clean = (value) => String(value || "").trim();
    const splitProjectLabel = (label) => {
      const raw = clean(label);
      if (!raw) return { projectNumber: "", projectShortName: "" };
      const parts = raw.split(" - ");
      if (parts.length >= 2) {
        return {
          projectNumber: clean(parts.shift()),
          projectShortName: clean(parts.join(" - ")),
        };
      }
      return { projectNumber: "", projectShortName: raw };
    };

    if (!projectId) return splitProjectLabel(this.router?.context?.projectLabel || "");

    const api = window.bbmDb || {};
    if (typeof api.projectsList === "function") {
      try {
        const result = await api.projectsList();
        if (result?.ok && Array.isArray(result.list)) {
          const project = result.list.find((item) => item && item.id === projectId) || null;
          if (project) {
            const projectNumber = clean(project.project_number ?? project.projectNumber ?? "");
            const projectShortName = clean(
              project.short ?? project.short_name ?? project.projectShortName ?? ""
            );
            if (projectNumber || projectShortName) return { projectNumber, projectShortName };
          }
        }
      } catch (err) {
        console.warn("[protokoll-mail] project context fallback used:", err);
      }
    }

    const fallbackLabel =
      this.getActiveProjectLabel(projectId) || this.router?.context?.projectLabel || "";
    return splitProjectLabel(fallbackLabel);
  }

  formatDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (direct) return `${direct[3]}.${direct[2]}.${direct[1]}`;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${date.getFullYear()}`;
  }

  async resolveProtocolTitle(projectId = null) {
    const api = window.bbmDb || {};
    try {
      if (projectId && typeof api.projectSettingsGetMany === "function") {
        const result = await api.projectSettingsGetMany({
          projectId,
          keys: ["pdf.protocolTitle"],
        });
        const value = String(result?.data?.["pdf.protocolTitle"] || "").trim();
        if (result?.ok && value) return value;
      }
    } catch (_err) {
      // Bestehender Fallback auf globale Einstellung.
    }
    try {
      if (typeof api.appSettingsGetMany === "function") {
        const result = await api.appSettingsGetMany(["pdf.protocolTitle"]);
        const value = String(result?.data?.["pdf.protocolTitle"] || "").trim();
        if (result?.ok && value) return value;
      }
    } catch (_err) {
      // Bestehender Fallback auf Standardtitel.
    }
    return "Baubesprechung";
  }

  async getStoredTemplate() {
    const api = window.bbmDb || {};
    const template = { subject: "", body: "" };
    if (typeof api.appSettingsGetMany !== "function") return template;
    try {
      const result = await api.appSettingsGetMany(["email_subject", "email_body"]);
      if (!result?.ok) return template;
      template.subject = String(result.data?.email_subject || "");
      template.body = String(result.data?.email_body || "");
    } catch (_err) {
      // Bestehender Fallback auf leere Vorlage.
    }
    return template;
  }

  buildTemplateContext({ projectNumber, projectShortName, protocolTitle, meeting } = {}) {
    const clean = (value) => String(value || "").trim();
    const meetingIndex = clean(
      meeting?.meeting_index ?? meeting?.meetingIndex ?? meeting?.index ?? meeting?.number ?? ""
    );
    const meetingDate = this.formatDate(
      meeting?.meeting_date ||
        meeting?.meetingDate ||
        meeting?.date ||
        meeting?.created_at ||
        meeting?.createdAt ||
        ""
    );
    return {
      projectNumber: clean(projectNumber),
      projectShortName: clean(projectShortName),
      protocolTitle: clean(protocolTitle) || "Protokoll",
      meetingIndex,
      meetingDate,
    };
  }

  defaultSubject(context = {}) {
    const clean = (value) => String(value || "").trim();
    const left = [clean(context.projectNumber), clean(context.projectShortName)]
      .filter(Boolean)
      .join(" - ");
    let right = clean(context.protocolTitle) || "Protokoll";
    if (clean(context.meetingIndex)) right += ` #${clean(context.meetingIndex)}`;
    if (clean(context.meetingDate)) right += ` - ${clean(context.meetingDate)}`;
    if (left && right) return `${left}  |  ${right}`;
    return left || right;
  }

  applySubjectTemplate(template, context = {}) {
    const raw = String(template || "");
    if (!raw.trim()) return this.defaultSubject(context);
    const replacements = {
      "{projectNumber}": String(context.projectNumber || ""),
      "{projectShortName}": String(context.projectShortName || ""),
      "{protocolTitle}": String(context.protocolTitle || ""),
      "{meetingIndex}": String(context.meetingIndex || ""),
      "{meetingDate}": String(context.meetingDate || ""),
    };
    let output = raw;
    Object.entries(replacements).forEach(([token, value]) => {
      output = output.split(token).join(value);
    });
    output = output
      .replace(/\s+\|\s+\|\s+/g, "  |  ")
      .replace(/\s*\|\s*/g, "  |  ")
      .replace(/\s{3,}/g, "  ")
      .replace(/\s+-\s+-\s+/g, " - ")
      .replace(/\s+#\s+-/g, " -")
      .replace(/\|\s*$/g, "")
      .trim();
    return output || this.defaultSubject(context);
  }

  buildFallbackSubject({ projectNumber, projectShortName, mailType } = {}) {
    const clean = (value) => String(value || "").trim();
    const base = [clean(projectNumber), clean(projectShortName)].filter(Boolean).join(" - ");
    const type = clean(mailType);
    if (!type) return base;
    return base ? `${base} - ${type}` : type;
  }

  getDefaultBody() {
    return (
      "Sehr geehrte Damen und Herren,\n\n" +
      "anbei erhalten Sie das neue Protokoll für das oben genannte Projekt mit der Bitte um Beachtung und Veranlassung."
    );
  }

  buildInitialRecipientSelection(options = {}) {
    const all = Array.isArray(options?.all) ? options.all : [];
    const distribution = Array.isArray(options?.distribution) ? options.distribution : [];
    if (options?.anyDistributionField && distribution.length) return [...distribution];
    return [...all];
  }

  buildAttachmentEntries(attachmentsByKey = {}) {
    return [
      { key: "protocol", label: "Protokoll", path: String(attachmentsByKey?.protocol || "").trim(), selected: true },
      { key: "firms", label: "Firmenliste", path: String(attachmentsByKey?.firms || "").trim(), selected: true },
      { key: "todo", label: "ToDo-Liste", path: String(attachmentsByKey?.todo || "").trim(), selected: true },
      { key: "tops", label: "Top-Liste", path: String(attachmentsByKey?.tops || "").trim(), selected: true },
    ];
  }

  async buildDraft({ projectId = null, meeting = null, mailType = "", subject = "", body } = {}) {
    const { projectNumber, projectShortName } = await this.getCurrentProjectContext();
    const protocolTitle = await this.resolveProtocolTitle(projectId);
    const emailTemplate = await this.getStoredTemplate();
    const templateContext = this.buildTemplateContext({
      projectNumber,
      projectShortName,
      protocolTitle,
      meeting,
    });
    const nextSubject =
      String(subject || "").trim() ||
      this.applySubjectTemplate(emailTemplate.subject || "", templateContext) ||
      this.buildFallbackSubject({ projectNumber, projectShortName, mailType }) ||
      this.defaultSubject(templateContext) ||
      "Protokoll";
    let nextBody = typeof body === "string" ? body : String(emailTemplate.body || "");
    if (!nextBody.trim()) nextBody = this.getDefaultBody();
    return { subject: nextSubject, body: nextBody, templateContext };
  }

  async getMeetingRecipientOptions(meetingId = null) {
    const selectedMeeting =
      this.router?.activeView?.getSelectedClosedMeetingForEmail?.() ||
      this.router?.activeView?.getSelectedClosedMeeting?.() ||
      null;
    const effectiveMeetingId = meetingId || selectedMeeting?.id || null;
    if (!effectiveMeetingId) return { distribution: [], all: [], anyDistributionField: false };
    const api = window.bbmDb || {};
    if (typeof api.meetingParticipantsList !== "function") {
      return { distribution: [], all: [], anyDistributionField: false };
    }

    const readEmail = (item) =>
      String(
        item?.email ??
          item?.email_raw ??
          item?.mail ??
          item?.e_mail ??
          item?.person_email ??
          item?.personEmail ??
          item?.participant_email ??
          item?.participantEmail ??
          ""
      ).trim();
    const distributionKeys = [
      "isInDistribution",
      "is_in_distribution",
      "inDistribution",
      "in_distribution",
      "send_email",
      "sendEmail",
      "email_enabled",
      "emailEnabled",
    ];
    const hasDistributionField = (item) =>
      !!item && distributionKeys.some((key) => Object.prototype.hasOwnProperty.call(item, key));
    const inDistribution = (item) =>
      Number(
        distributionKeys
          .map((key) => item?.[key])
          .find((value) => value !== undefined && value !== null) ?? 0
      ) === 1;
    const uniqueEmails = (items) => {
      const seen = new Set();
      const output = [];
      for (const item of items) {
        const email = readEmail(item);
        const key = email.toLowerCase();
        if (!email || seen.has(key)) continue;
        seen.add(key);
        output.push(email);
      }
      return output;
    };

    try {
      const result = await api.meetingParticipantsList({ meetingId: effectiveMeetingId });
      const rows = Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result?.list)
          ? result.list
          : [];
      if (!result?.ok || !rows.length) {
        return { distribution: [], all: [], anyDistributionField: false };
      }
      const anyDistributionField = rows.some(hasDistributionField);
      const all = uniqueEmails(rows);
      if (!anyDistributionField) return { distribution: [...all], all, anyDistributionField: false };
      return {
        distribution: uniqueEmails(rows.filter(inDistribution)),
        all,
        anyDistributionField: true,
      };
    } catch (err) {
      console.warn("[protokoll-mail] recipients lookup failed:", err);
      return { distribution: [], all: [], anyDistributionField: false };
    }
  }

  async getSelectedMeetingRecipients() {
    const options = await this.getMeetingRecipientOptions();
    if (options.anyDistributionField && options.distribution.length) return options.distribution;
    return options.all.length ? options.all : [];
  }

  async buildProtocolPdfLookupPayload(selectedMeeting, projectId) {
    if (!selectedMeeting || !projectId) return null;
    const api = window.bbmDb || {};
    if (typeof api.projectsList !== "function" || typeof api.appSettingsGetMany !== "function") {
      return null;
    }
    try {
      const [projectsResult, settingsResult] = await Promise.all([
        api.projectsList(),
        api.appSettingsGetMany(["pdf.protocolsDir", "pdf.protocolTitle"]),
      ]);
      if (!projectsResult?.ok || !Array.isArray(projectsResult.list) || !settingsResult?.ok) {
        return null;
      }
      const project = projectsResult.list.find((item) => item && item.id === projectId) || null;
      const baseDir = String(settingsResult.data?.["pdf.protocolsDir"] || "").trim();
      const protocolTitle =
        String(settingsResult.data?.["pdf.protocolTitle"] || "").trim() || "Baubesprechung";
      if (!project || !baseDir) return null;
      const cleanPart = (value) =>
        String(value || "")
          .replace(/[<>:"/\\|?*]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const date = new Date(
        selectedMeeting?.meeting_date ||
          selectedMeeting?.meetingDate ||
          selectedMeeting?.date ||
          selectedMeeting?.created_at ||
          selectedMeeting?.createdAt ||
          selectedMeeting?.updated_at ||
          selectedMeeting?.updatedAt ||
          ""
      );
      const dateParts = Number.isNaN(date.getTime())
        ? { dot: "", iso: "" }
        : {
            dot: `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`,
            iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
          };
      const meetingIndex =
        selectedMeeting?.meeting_index ??
        selectedMeeting?.meetingIndex ??
        selectedMeeting?.index ??
        selectedMeeting?.number ??
        "";
      const numberPart = cleanPart(
        project?.project_number ?? project?.projectNumber ?? project?.number ?? ""
      );
      const shortPart = cleanPart(project?.short || project?.name || "");
      const titlePart = cleanPart(protocolTitle);
      const expectedFileNames = [];
      if (numberPart && titlePart && meetingIndex && dateParts.iso) {
        expectedFileNames.push(`${numberPart}_${titlePart}_#${meetingIndex}-${dateParts.iso}.pdf`);
      }
      if (numberPart && shortPart && titlePart && meetingIndex && dateParts.dot) {
        expectedFileNames.push(
          `${numberPart}_${shortPart}_${titlePart}_#${meetingIndex} - ${dateParts.dot}.pdf`
        );
      }
      return {
        baseDir,
        project: {
          project_number: project?.project_number ?? project?.projectNumber ?? project?.number ?? "",
          short: project?.short || "",
          name: project?.name || "",
        },
        expectedFileNames,
        meetingIndex: String(meetingIndex || "").trim(),
      };
    } catch (err) {
      console.warn("[protokoll-mail] protocol pdf lookup payload failed:", err);
      return null;
    }
  }
}
