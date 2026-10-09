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

function createServices(router) {
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
      async listPositions(id) {
        return requireOk(await window.bbmDb.azlPositionsList(id), "list") || [];
      },
      async replacePositions(id, positions) {
        return requireOk(await window.bbmDb.azlPositionsReplace(id, positions), "list") || [];
      },
      async listDocuments(id, documentKind = null) {
        return requireOk(await window.bbmDb.azlDocumentsList(id, documentKind), "list") || [];
      },
      async chooseOffer(projectId, id) {
        return requireOk(await window.bbmDb.azlOfferChoose(projectId, id), "result");
      },
      async removeOffer(id) {
        return requireOk(await window.bbmDb.azlOfferRemove(id), "document");
      },
    }),
    preferences: Object.freeze({
      async get() {
        return requireOk(await window.bbmDb.azlPreferencesGet(), "preferences") || {};
      },
      async setIssuer(issuerName) {
        return requireOk(await window.bbmDb.azlPreferencesSetIssuer(issuerName), "preferences") || {};
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
        const list = requireOk(result, "list") || [];
        return list.map((firm) => ({
          ...firm,
          ref: firm?.ref
            ? {
                ...firm.ref,
                kind: firm.ref.kind === "global_firm"
                  ? "global"
                  : firm.ref.kind === "project_firm"
                    ? "project"
                    : firm.ref.kind,
              }
            : firm?.ref,
        }));
      },
    }),
    firmPool: Object.freeze({
      async list() {
        const result = await window.bbmDb.firmDirectoryListAll({
          kind: "global_firm",
          includeInactive: true,
        });
        const list = requireOk(result, "list") || [];
        return list.map((firm) => ({
          ...firm,
          ref: firm?.ref
            ? { ...firm.ref, kind: "global" }
            : { kind: "global", id: firm?.id },
        }));
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
    project: Object.freeze({
      async getBuilder(projectId) {
        const result = await window.bbmDb.projectsGetBuilder({ projectId });
        return requireOk(result, "data") || null;
      },
      async getOwnOrganization() {
        const result = await window.bbmDb.ownOrganizationGet();
        return requireOk(result, "organization") || null;
      },
    }),
    navigation: Object.freeze({
      async openProjectFirms(projectId) {
        if (typeof router?.showProjectFirms !== "function") {
          throw new Error("Projektfirmenverwaltung ist nicht verfügbar.");
        }
        await router.showProjectFirms(projectId);
      },
    }),
    orcaImport: Object.freeze({
      async chooseAndPlan() {
        return requireOk(await window.bbmDb.azlOrcaChooseAndPlan(), "result");
      },
      async apply(plan) {
        return requireOk(await window.bbmDb.azlOrcaApply(plan), "result");
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
      services: createServices(this.router),
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
