import AzlQuicklane from "./AzlQuicklane.js";

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

function isBuilderFirm(firm) {
  const values = [
    firm?.gewerk,
    firm?.project_role,
    firm?.projectRole,
    firm?.role,
    firm?.function,
    firm?.funktion,
    firm?.funktion_gewerk,
    firm?.funktionGewerk,
  ];
  return values.some((value) => String(value || "").toLocaleLowerCase("de").includes("bauherr"));
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
      async chooseOfferReview() {
        return requireOk(await window.bbmDb.azlOfferReviewChoose(), "result");
      },
      async commitOfferReview(projectId, id, reviewToken) {
        return requireOk(await window.bbmDb.azlOfferReviewCommit(projectId, id, reviewToken), "result");
      },
      async openOfferReview(reviewToken) {
        return requireOk(await window.bbmDb.azlOfferReviewOpen(reviewToken), "result");
      },
      async discardOfferReview(reviewToken) {
        return requireOk(await window.bbmDb.azlOfferReviewDiscard(reviewToken), "result");
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
        const list = (requireOk(result, "list") || []).filter((firm) => !isBuilderFirm(firm));
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
      async closeProjectModule(projectId, project = null) {
        if (typeof router?.showProjectWorkspace !== "function") {
          throw new Error("Projektübersicht ist nicht verfügbar.");
        }
        await router.showProjectWorkspace(projectId, { project });
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
    this.inner = null;
    this.quicklane = null;
    this._onFirmDataChanged = async () => {
      if (!this.root?.isConnected || !this.inner) return;
      try {
        await this.inner.refreshContracts?.();
        await this.inner.refreshProjectFirms?.();
        this.inner.syncContractDisplay?.();
      } catch (_error) {
        // azL bleibt benutzbar; nächster normaler Refresh versucht es erneut.
      }
    };
    window.addEventListener("bbm:pool-data-changed", this._onFirmDataChanged);
  }

  async _ensureInner() {
    if (this.inner) return this.inner;
    const moduleUrl = new URL("../../../../node_modules/bbm-azl/src/ui/AzlScreen.js", import.meta.url).href;
    const module = await import(moduleUrl);
    const ExternalAzlScreen = module?.default;
    if (typeof ExternalAzlScreen !== "function") {
      throw new Error("BBM-azL Screen ist nicht verfügbar.");
    }
    this.inner = new ExternalAzlScreen({
      projectId: this.projectId,
      project: this.project,
      services: createServices(this.router),
    });
    return this.inner;
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
        const inner = await this._ensureInner();
        await inner.mount(this.root);
        this.quicklane?.destroy?.();
        this.quicklane = new AzlQuicklane({
          onProject: async () => {
            if (typeof this.router?.openProjectFormModal === "function") {
              await this.router.openProjectFormModal({ projectId: this.projectId });
              return;
            }
            await this.router?.showProjectForm?.({ projectId: this.projectId });
          },
          onFirms: async () => {
            await this.router?.showProjectFirms?.(this.projectId, {
              returnContext: {
                section: "azl",
                projectId: this.projectId,
                project: this.project || null,
              },
            });
          },
          onNew: () => {
            this.inner?.management?.clear?.click?.();
          },
          onSave: () => {
            this.inner?.management?.save?.click?.();
          },
          onClose: async () => {
            if (typeof this.inner?.closeModule === "function") {
              await this.inner.closeModule();
              return;
            }
            await this.router?.showProjectWorkspace?.(this.projectId, { project: this.project });
          },
        });
        this.quicklane.mount();
      } catch (error) {
        if (!this.root) return;
        this.root.textContent = `azL konnte nicht geöffnet werden: ${error?.message || error}`;
      }
    });

    return root;
  }

  destroy() {
    if (this._onFirmDataChanged) {
      window.removeEventListener("bbm:pool-data-changed", this._onFirmDataChanged);
    }
    try {
      this.quicklane?.destroy?.();
    } catch (_error) {}
    this.quicklane = null;
    try {
      this.inner?.destroy?.();
    } catch (_error) {}
    this.inner = null;
    this.root = null;
  }
}
