import ExternalAzlScreen from "../../../../node_modules/bbm-azl/src/ui/AzlScreen.js";

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
      services: createServices(),
    });
  }

  render() {
    const root = document.createElement("section");
    root.className = "bbm-azl-host";
    this.root = root;

    queueMicrotask(async () => {
      if (!this.root?.isConnected) return;
      try {
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
