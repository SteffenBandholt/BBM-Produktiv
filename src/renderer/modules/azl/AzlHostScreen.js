import ExternalAzlScreen from "../../../../node_modules/bbm-azl/src/ui/AzlScreen.js";

const AZL_STYLE_ID = "bbm-azl-module-style";

function ensureAzlStyles() {
  if (document.getElementById(AZL_STYLE_ID)) return;
  const link = document.createElement("link");
  link.id = AZL_STYLE_ID;
  link.rel = "stylesheet";
  link.href = new URL("../../../../node_modules/bbm-azl/src/ui/azl.css", import.meta.url).href;
  document.head.appendChild(link);
}

function requireOk(result, key) {
  if (!result?.ok) throw new Error(result?.error || "azL-Daten konnten nicht verarbeitet werden.");
  return result[key];
}

function createServices() {
  return Object.freeze({
    azl: Object.freeze({
      async createDraft(input) {
        return requireOk(await window.bbmDb.azlCreateDraft(input), "azl");
      },
      async getById(id) {
        return requireOk(await window.bbmDb.azlGet(id), "azl");
      },
      async update(id, patch) {
        return requireOk(await window.bbmDb.azlUpdate(id, patch), "azl");
      },
      async setStatus(id, status) {
        return requireOk(await window.bbmDb.azlSetStatus(id, status), "azl");
      },
    }),
    azlList: Object.freeze({
      async list(projectId) {
        return requireOk(await window.bbmDb.azlList(projectId), "list") || [];
      },
    }),
    contracts: Object.freeze({
      async list(projectId) {
        return requireOk(await window.bbmDb.azlContractsList(projectId), "list") || [];
      },
      async save(input) {
        return requireOk(await window.bbmDb.azlContractSave(input), "result");
      },
    }),
    projectFirms: Object.freeze({
      async list(projectId) {
        const result = await window.bbmDb.firmDirectoryListProjectParticipants({
          projectId,
          includeInactive: false,
        });
        return requireOk(result, "list") || [];
      },
    }),
    firmPool: Object.freeze({
      async list() {
        const result = await window.bbmDb.firmDirectoryListAll({
          kind: "global",
          includeInactive: true,
        });
        return requireOk(result, "list") || [];
      },
      async assign({ projectId, firmId }) {
        const result = await window.bbmDb.projectFirmsAssignGlobalFirm({
          projectId,
          firmId,
        });
        if (!result?.ok) throw new Error(result?.error || "Firma konnte nicht zugeordnet werden.");
        return result.result;
      },
    }),
  });
}

export default class AzlHostScreen {
  constructor({ router, projectId, project = null } = {}) {
    this.router = router || null;
    this.projectId = projectId || null;
    this.project = project || null;
    this.root = null;
    this.inner = new ExternalAzlScreen({
      projectId: this.projectId,
      project: this.project,
      services: createServices(),
    });
  }

  render() {
    ensureAzlStyles();
    const root = document.createElement("section");
    root.className = "bbm-azl-host";
    this.root = root;

    queueMicrotask(async () => {
      if (!this.root?.isConnected) return;

      if (!this.projectId) {
        this.root.textContent = "Bitte zuerst ein Projekt auswählen …";
        try {
          window.localStorage?.setItem?.("bbm.startTargetModuleId", "azl");
        } catch (_e) {
          // ignore
        }
        if (typeof this.router?.showProjects === "function") {
          await this.router.showProjects();
        }
        return;
      }

      try {
        this.router?._setProjectRuntimeContext?.({ projectId: this.projectId, meetingId: null });
        await this.inner.mount(this.root);
      } catch (error) {
        if (!this.root) return;
        this.root.textContent = `azL konnte nicht geöffnet werden: ${error?.message || error}`;
      }
    });

    return root;
  }

  destroy() {
    this.root = null;
  }
}
