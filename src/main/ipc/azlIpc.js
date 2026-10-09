"use strict";

const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { TextDecoder } = require("node:util");
const { dialog, shell } = require("electron");
const { initDatabase } = require("../db/database");
const projectsRepo = require("../db/projectsRepo");
const { getFirmDirectoryService } = require("../domain/firms/FirmDirectoryService");
const { appSettingsGetMany, appSettingsSetMany } = require("../db/appSettingsRepo");
const { createProjectStorageAccess, sanitizeDirName } = require("./projectStoragePaths");

let runtimePromise = null;
const pendingOfferReviews = new Map();

function fail(error) {
  return {
    ok: false,
    error: error?.message || String(error),
    code: error?.code || null,
  };
}

function toBbmFirmKind(kind) {
  const normalized = String(kind || "").trim();
  if (normalized === "global" || normalized === "global_firm") return "global_firm";
  if (normalized === "project" || normalized === "project_firm") return "project_firm";
  return normalized;
}

function toBbmFirmRef(ref = {}) {
  return {
    ...ref,
    kind: toBbmFirmKind(ref.kind),
  };
}

function createPorts() {
  const firms = getFirmDirectoryService();
  return {
    projectPort: {
      getById(projectId) {
        return projectsRepo.getById(projectId);
      },
    },
    firmsPort: {
      get(payload) {
        const ref = payload?.ref || payload || {};
        return firms.get(toBbmFirmRef(ref));
      },
      listAll(payload) {
        const source = payload || {};
        return firms.listAll({
          ...source,
          kind: toBbmFirmKind(source.kind),
        });
      },
      listProjectParticipants(payload) {
        return firms.listProjectParticipants(payload || {});
      },
      create(payload) {
        const source = payload || {};
        return firms.create({
          ...source,
          kind: toBbmFirmKind(source.kind),
          origin: source.origin || (toBbmFirmKind(source.kind) === "global_firm" ? "firms" : "project_firms"),
        });
      },
      update(payload) {
        const source = payload || {};
        return firms.update({
          ...source,
          ref: toBbmFirmRef(source.ref || {}),
        });
      },
    },
  };
}

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [
        { AzlRepository },
        { AzlService },
        { AzlListService },
        { ProjectContractService },
        { ReportingService },
        { OrcaFirmImportService },
      ] = await Promise.all([
        import("bbm-azl/src/infrastructure/sqlite/AzlRepository.js"),
        import("bbm-azl/src/application/AzlService.js"),
        import("bbm-azl/src/application/AzlListService.js"),
        import("bbm-azl/src/application/ProjectContractService.js"),
        import("bbm-azl/src/application/ReportingService.js"),
        import("bbm-azl/src/application/OrcaFirmImportService.js"),
      ]);

      const repository = new AzlRepository({ db: initDatabase() });
      const { projectPort, firmsPort } = createPorts();

      return Object.freeze({
        repository,
        azl: new AzlService({ repository }),
        azlList: new AzlListService({ repository }),
        contracts: new ProjectContractService({ projectPort, firmsPort, repository }),
        reporting: new ReportingService({ repository }),
        orca: new OrcaFirmImportService({ firmsPort }),
      });
    })();
  }
  return runtimePromise;
}


function decodeCsvBuffer(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return bytes.subarray(3).toString("utf8");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (_error) {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function normalizePdfText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseGermanMoneyToCents(value) {
  const raw = String(value || "").trim().replace(/\s/g, "").replace(/[€EUR]/gi, "");
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",")) normalized = raw.replace(/\./g, "").replace(",", ".");
  else if ((raw.match(/\./g) || []).length > 1) normalized = raw.replace(/\./g, "");
  const amount = Number(normalized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function normalizeGermanDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})\b/);
  if (!match) return "";
  const year = match[3].length === 2 ? Number("20" + match[3]) : Number(match[3]);
  const month = Number(match[2]);
  const day = Number(match[1]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return "";
  return String(year).padStart(4, "0") + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

function detectOfferFields(text) {
  const source = normalizePdfText(text);
  const offerNumberPatterns = [
    /(?:Angebots?(?:nummer|nr\.?|[- ]nr\.?)|Angebot\s*(?:Nr\.?|Nummer))\s*[:#]?\s*([A-Z0-9][A-Z0-9./_-]{1,40})/i,
    /\bAN[- /]?\d{2,}[A-Z0-9./_-]*\b/i,
  ];
  let offerNumber = "";
  for (const pattern of offerNumberPatterns) {
    const m = source.match(pattern);
    if (m) { offerNumber = String(m[1] || m[0] || "").trim(); break; }
  }

  let offerDate = "";
  const dateContext = source.match(/(?:Angebotsdatum|Datum|Angebot vom)\s*[: ]{0,3}(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/i);
  if (dateContext) offerDate = normalizeGermanDate(dateContext[1]);
  if (!offerDate) {
    const genericDate = source.match(/\b\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}\b/);
    if (genericDate) offerDate = normalizeGermanDate(genericDate[0]);
  }

  let netCents = null;
  const moneyPatterns = [
    /(?:Angebotssumme|Gesamtsumme|Summe)\s*(?:netto)?\s*[: ]{0,3}([0-9][0-9.\s]*,[0-9]{2})\s*(?:€|EUR)?/i,
    /(?:Netto(?:summe|betrag)?|Zwischensumme)\s*[: ]{0,3}([0-9][0-9.\s]*,[0-9]{2})\s*(?:€|EUR)?/i,
  ];
  for (const pattern of moneyPatterns) {
    const m = source.match(pattern);
    if (m) { netCents = parseGermanMoneyToCents(m[1]); if (netCents !== null) break; }
  }

  return {
    offerNumber, offerDate, netCents,
    textFound: source.length > 30,
    textSnippet: source.slice(0, 5000),
  };
}

async function extractOfferReview(filePath) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(await fs.promises.readFile(filePath));
    const task = pdfjs.getDocument({ data, disableWorker: true, useSystemFonts: true });
    const pdf = await task.promise;
    const pageCount = Math.min(pdf.numPages || 0, 3);
    const chunks = [];
    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      chunks.push(content.items.map((item) => item?.str || "").join(" "));
    }
    return { pageCount: Number(pdf.numPages || 0), ...detectOfferFields(chunks.join(" \n ")) };
  } catch (error) {
    return {
      pageCount: null, offerNumber: "", offerDate: "", netCents: null,
      textFound: false, textSnippet: "", extractionError: error?.message || String(error),
    };
  }
}

async function chooseOfferForReview() {
  const result = await dialog.showOpenDialog({
    title: "Angebot zur Prüfung auswählen",
    properties: ["openFile"],
    filters: [{ name: "PDF-Dateien", extensions: ["pdf"] }],
  });
  if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
  const filePath = result.filePaths[0];
  const stat = await fs.promises.stat(filePath);
  const token = randomUUID();
  const extracted = await extractOfferReview(filePath);
  pendingOfferReviews.set(token, { filePath, createdAt: Date.now() });
  return {
    canceled: false, reviewToken: token, fileName: path.basename(filePath),
    fileUrl: pathToFileURL(filePath).href, fileSize: stat.size, extracted,
  };
}

async function commitOfferReview({ projectId, azlId, reviewToken } = {}) {
  const token = String(reviewToken || "").trim();
  const pending = pendingOfferReviews.get(token);
  if (!pending) throw new Error("Die Angebotsauswahl ist nicht mehr verfügbar. Bitte PDF erneut auswählen.");
  const id = String(azlId || "").trim();
  if (!id) throw new TypeError("azL-ID fehlt.");
  const runtime = await getRuntime();
  const azl = runtime.azl.getById(id);
  if (!azl) throw new Error("azL nicht gefunden.");
  if (String(azl.project_id ?? azl.projectId) !== String(projectId || "")) throw new Error("AzL gehört nicht zum angegebenen Projekt.");
  const storage = createProjectStorageAccess();
  const paths = storage.ensure({ projectId, moduleId: "azl" });
  const sourcePath = pending.filePath;
  const baseName = sanitizeDirName(path.basename(sourcePath, path.extname(sourcePath))) || "Angebot";
  let targetPath = path.join(paths.targets.Angebote, baseName + ".pdf");
  let index = 2;
  while (fs.existsSync(targetPath)) targetPath = path.join(paths.targets.Angebote, baseName + " (" + (index++) + ").pdf");
  await fs.promises.copyFile(sourcePath, targetPath);
  const document = runtime.azl.replaceOfferDocument(id, {
    storageRef: targetPath, originalName: path.basename(sourcePath),
    mimeType: "application/pdf", sourceKind: "file",
  });
  pendingOfferReviews.delete(token);
  return { document };
}

async function openOfferReview({ reviewToken } = {}) {
  const pending = pendingOfferReviews.get(String(reviewToken || "").trim());
  if (!pending) throw new Error("Angebotsauswahl nicht mehr verfügbar.");
  const error = await shell.openPath(pending.filePath);
  if (error) throw new Error(error);
  return true;
}

function discardOfferReview({ reviewToken } = {}) {
  pendingOfferReviews.delete(String(reviewToken || "").trim());
  return true;
}
async function chooseOfferPdf({ projectId, azlId } = {}) {
  const id = String(azlId || "").trim();
  if (!id) throw new TypeError("azL-ID fehlt.");
  const result = await dialog.showOpenDialog({
    title: "Angebot zur AzL auswählen",
    properties: ["openFile"],
    filters: [{ name: "PDF-Dateien", extensions: ["pdf"] }],
  });
  if (result.canceled || !result.filePaths?.[0]) return { canceled: true };

  const sourcePath = result.filePaths[0];
  const runtime = await getRuntime();
  const azl = runtime.azl.getById(id);
  if (!azl) throw new Error("azL nicht gefunden.");
  if (String(azl.project_id ?? azl.projectId) !== String(projectId || "")) {
    throw new Error("AzL gehört nicht zum angegebenen Projekt.");
  }

  const storage = createProjectStorageAccess();
  const paths = storage.ensure({ projectId, moduleId: "azl" });
  const baseName = sanitizeDirName(path.basename(sourcePath, path.extname(sourcePath))) || "Angebot";
  const ext = ".pdf";
  let targetPath = path.join(paths.targets.Angebote, `${baseName}${ext}`);
  let index = 2;
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(paths.targets.Angebote, `${baseName} (${index++})${ext}`);
  }
  await fs.promises.copyFile(sourcePath, targetPath);

  const document = runtime.azl.replaceOfferDocument(id, {
    storageRef: targetPath,
    originalName: path.basename(sourcePath),
    mimeType: "application/pdf",
    sourceKind: "file",
  });
  return { canceled: false, document };
}

async function chooseOrcaCsvFile() {
  const result = await dialog.showOpenDialog({
    title: "ORCA-Firmen CSV auswählen",
    properties: ["openFile"],
    filters: [
      { name: "CSV-Dateien", extensions: ["csv"] },
      { name: "Textdateien", extensions: ["txt"] },
    ],
  });
  if (result.canceled || !result.filePaths?.[0]) return null;
  const filePath = result.filePaths[0];
  const buffer = await fs.promises.readFile(filePath);
  return {
    filePath,
    fileName: path.basename(filePath),
    csvText: decodeCsvBuffer(buffer),
  };
}

function registerAzlIpc({ ipcMain } = {}) {
  if (!ipcMain || typeof ipcMain.handle !== "function") {
    throw new TypeError("ipcMain.handle ist für azL erforderlich.");
  }

  const handle = (channel, operation, resultKey) => {
    ipcMain.handle(channel, async (_event, payload) => {
      try {
        const runtime = await getRuntime();
        const result = await operation(runtime, payload || {});
        return { ok: true, [resultKey]: result };
      } catch (error) {
        return fail(error);
      }
    });
  };

  handle("azl:list", (runtime, data) => runtime.azlList.list(data.projectId), "list");
  handle("azl:get", (runtime, data) => runtime.azl.getById(data.id), "azl");
  handle("azl:createDraft", (runtime, data) => runtime.azl.createDraft(data), "azl");
  handle("azl:update", (runtime, data) => runtime.azl.update(data.id, data.patch || {}), "azl");
  handle("azl:setStatus", (runtime, data) => runtime.azl.setStatus(data.id, data.status), "azl");
  handle("azl:positions:list", (runtime, data) => runtime.azl.listPositions(data.id), "list");
  handle("azl:positions:replace", (runtime, data) => runtime.azl.replacePositions(data.id, data.positions || []), "list");
  handle("azl:documents:list", (runtime, data) => runtime.azl.listDocuments(data.id, data.documentKind || null), "list");
  handle("azl:offer:review:choose", async () => chooseOfferForReview(), "result");
  handle("azl:offer:review:commit", async (_runtime, data) => commitOfferReview(data), "result");
  handle("azl:offer:review:open", async (_runtime, data) => openOfferReview(data), "result");
  handle("azl:offer:review:discard", async (_runtime, data) => discardOfferReview(data), "result");
  handle("azl:offer:choose", async (_runtime, data) => chooseOfferPdf(data), "result");
  handle("azl:offer:remove", (runtime, data) => runtime.azl.replaceOfferDocument(data.id, null), "document");
  handle("azl:preferences:get", async () => {
    const settings = appSettingsGetMany(["azl.defaultIssuerName"]);
    return { issuerName: String(settings?.["azl.defaultIssuerName"] || "") };
  }, "preferences");
  handle("azl:preferences:setIssuer", async (_runtime, data) => {
    const issuerName = String(data.issuerName || "").trim();
    appSettingsSetMany({ "azl.defaultIssuerName": issuerName });
    return { issuerName };
  }, "preferences");
  handle("azl:contracts:list", (runtime, data) => runtime.contracts.list(data.projectId), "list");
  handle("azl:contracts:save", (runtime, data) => runtime.contracts.save(data), "result");
  handle("azl:orders:list", (runtime, data) => runtime.contracts.listOrders(data.contractId), "list");
  handle("azl:orders:save", (runtime, data) => runtime.contracts.saveOrder(data), "order");
  handle("azl:orders:delete", (runtime, data) => runtime.contracts.deleteOrder(data.id), "result");
  handle("azl:report:project", (runtime, data) => runtime.reporting.project(data.projectId), "report");
  handle("azl:report:firm", (runtime, data) => runtime.reporting.firm(data.contractId), "report");

  handle("azl:orca:chooseAndPlan", async (runtime) => {
    const selected = await chooseOrcaCsvFile();
    if (!selected) return { canceled: true };
    const plan = await runtime.orca.plan({ csvText: selected.csvText });
    return {
      canceled: false,
      fileName: selected.fileName,
      plan,
    };
  }, "result");

  handle("azl:orca:apply", async (runtime, data) => {
    return await runtime.orca.apply(data.plan);
  }, "result");

  console.log("[main] azL IPC registered");
}

module.exports = Object.freeze({ registerAzlIpc });
