"use strict";
const { PDF_TARGET_OPERATIONS, PDF_TARGET_CONTRACT_VERSION, createPdfRegistryFingerprint } = require("ui-editor-kit");
const { createDeclarativePdfAdapter } = require("./declarativePdfAdapter.cjs");
const { registerPdfEditorAdapter } = require("./pdfAdapterRegistry.cjs");
const DOCUMENT_TYPE_ID = "sigeko-vorankuendigung";
const SCOPE_ID = "pdf.bbm.sigeko-vorankuendigung";
// Explicit fixed-layout declarations from SIGEKO_S5_3B2_PDF_ENTWURF.md.
// Geometry is a nominal body grid; PrintShell owns the actual flowing page/header.
const DECLARATIONS = [
  ["",null,"document","layout","Vorankündigung",0.0,0.0,210.0,297.0,null],
  ["page","","page","layout","A4-Seite",0.0,0.0,210.0,297.0,null],
  ["globalHeader","page","header","layout","Gemeinsamer V2-GlobalHeader",12.0,5.0,186.0,8.0,null],
  ["fullHeader","page","header","layout","Gemeinsamer V2-FullHeader",12.0,14.0,186.0,40.0,null],
  ["body","page","area","layout","Vorankündigungsformular",12.0,56.0,186.0,227.0,null],
  ["authority","body","group","layout","Zuständige Arbeitsschutzbehörde",12.0,56.0,186.0,21.0,null],
  ["authority.label","authority","label","fieldLabel","An die Arbeitsschutzbehörde",12.0,56.0,186.0,5.0,9.0],
  ["authority.name","authority","value","content","Behördenname",12.0,61.0,186.0,8.0,9.0],
  ["authority.street","authority","value","content","Behördenstraße / Hausnummer",12.0,69.0,186.0,4.0,9.0],
  ["authority.zip","authority","value","content","Behörden-PLZ",12.0,73.0,20.0,4.0,9.0],
  ["authority.city","authority","value","content","Behördenort",34.0,73.0,164.0,4.0,9.0],
  ["title","body","label","fieldLabel","Vorankündigung (gem. § 2 (2) BaustellV)",12.0,78.0,186.0,7.0,12.0],
  ["p1","body","group","layout","1 Ort der Baustelle",12.0,87.0,186.0,16.0,null],
  ["p1.label","p1","label","fieldLabel","1 Ort der Baustelle",12.0,87.0,186.0,5.0,8.5],
  ["p2","body","group","layout","2 Name und Anschrift des Bauherrn",12.0,105.0,186.0,22.0,null],
  ["p2.label","p2","label","fieldLabel","2 Name und Anschrift des Bauherrn",12.0,105.0,186.0,5.0,8.5],
  ["p3","body","group","layout","3 Art des Bauvorhabens",12.0,129.0,186.0,13.0,null],
  ["p3.label","p3","label","fieldLabel","3 Art des Bauvorhabens",12.0,129.0,186.0,5.0,8.5],
  ["p4","body","group","layout","4 Name und Anschrift des verantwortlichen Dritten",12.0,144.0,186.0,23.0,null],
  ["p4.label","p4","label","fieldLabel","4 Name und Anschrift des verantwortlichen Dritten",12.0,144.0,186.0,5.0,8.5],
  ["p5","body","group","layout","5 Name und Anschrift des Koordinators / der Koordinatoren",12.0,169.0,186.0,34.0,null],
  ["p5.label","p5","label","fieldLabel","5 Name und Anschrift des Koordinators / der Koordinatoren",12.0,169.0,186.0,5.0,8.5],
  ["p6","body","group","layout","6 Voraussichtlicher Beginn und Dauer der Arbeiten",12.0,205.0,186.0,14.0,null],
  ["p6.label","p6","label","fieldLabel","6 Voraussichtlicher Beginn und Dauer der Arbeiten",12.0,205.0,186.0,5.0,8.5],
  ["p7","body","group","layout","7 Voraussichtliche Höchstzahl der Beschäftigten",12.0,221.0,186.0,13.0,null],
  ["p7.label","p7","label","fieldLabel","7 Voraussichtliche Höchstzahl der Beschäftigten",12.0,221.0,186.0,5.0,8.5],
  ["p8","body","group","layout","8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte",12.0,236.0,186.0,14.0,null],
  ["p8.label","p8","label","fieldLabel","8 Zahl der Arbeitgeber und Unternehmer ohne Beschäftigte",12.0,236.0,186.0,5.0,8.5],
  ["p9","body","group","layout","9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte",12.0,252.0,186.0,10.0,null],
  ["p9.label","p9","label","fieldLabel","9 Bereits ausgewählte Arbeitgeber und Unternehmer ohne Beschäftigte",12.0,252.0,186.0,5.0,8.5],
  ["p1.street","p1","value","content","Baustelle Straße / Hausnummer",12.0,93.0,186.0,4.0,9.0],
  ["p1.zip","p1","value","content","Baustelle PLZ",12.0,98.0,20.0,4.0,9.0],
  ["p1.city","p1","value","content","Baustelle Ort",34.0,98.0,164.0,4.0,9.0],
  ["p2.name","p2","value","content","Bauherr Name",12.0,111.0,94.0,4.0,9.0],
  ["p2.street","p2","value","content","Bauherr Straße / Hausnummer",12.0,116.0,94.0,4.0,9.0],
  ["p2.zip","p2","value","content","Bauherr Postleitzahl",12.0,121.0,20.0,4.0,9.0],
  ["p2.city","p2","value","content","Bauherr Ort",34.0,121.0,72.0,4.0,9.0],
  ["p2.phone","p2","value","content","Bauherr Telefon",112.0,111.0,86.0,4.0,9.0],
  ["p2.email","p2","value","content","Bauherr E-Mail",112.0,116.0,86.0,4.0,9.0],
  ["p4.name","p4","value","content","Dritter Name",12.0,150.0,94.0,4.0,9.0],
  ["p4.street","p4","value","content","Dritter Straße / Hausnummer",12.0,155.0,94.0,4.0,9.0],
  ["p4.zip","p4","value","content","Dritter Postleitzahl",12.0,160.0,20.0,4.0,9.0],
  ["p4.city","p4","value","content","Dritter Ort",34.0,160.0,72.0,4.0,9.0],
  ["p4.phone","p4","value","content","Dritter Telefon",112.0,150.0,86.0,4.0,9.0],
  ["p4.email","p4","value","content","Dritter E-Mail",112.0,155.0,86.0,4.0,9.0],
  ["p3.value","p3","value","content","Art des Bauvorhabens",12.0,135.0,186.0,7.0,9.0],
  ["p5.planning","p5","group","layout","Während der Planung der Ausführung",12.0,175.0,90.0,28.0,null],
  ["p5.planning.label","p5.planning","label","fieldLabel","Während der Planung der Ausführung",12.0,175.0,90.0,8.0,8.0],
  ["p5.planning.name","p5.planning","value","content","Während der Planung der Ausführung – Name",12.0,183.0,90.0,4.0,8.5],
  ["p5.planning.street","p5.planning","value","content","Während der Planung der Ausführung – Straße / Hausnummer",12.0,187.0,90.0,4.0,8.5],
  ["p5.planning.zip","p5.planning","value","content","Während der Planung der Ausführung – Postleitzahl",12.0,191.0,18.0,4.0,8.5],
  ["p5.planning.city","p5.planning","value","content","Während der Planung der Ausführung – Ort",32.0,191.0,70.0,4.0,8.5],
  ["p5.planning.phone","p5.planning","value","content","Während der Planung der Ausführung – Telefon",12.0,195.0,90.0,4.0,8.5],
  ["p5.planning.email","p5.planning","value","content","Während der Planung der Ausführung – E-Mail",12.0,199.0,90.0,4.0,8.5],
  ["p5.execution","p5","group","layout","Während der Ausführung des Bauvorhabens",108.0,175.0,90.0,28.0,null],
  ["p5.execution.label","p5.execution","label","fieldLabel","Während der Ausführung des Bauvorhabens",108.0,175.0,90.0,8.0,8.0],
  ["p5.execution.name","p5.execution","value","content","Während der Ausführung des Bauvorhabens – Name",108.0,183.0,90.0,4.0,8.5],
  ["p5.execution.street","p5.execution","value","content","Während der Ausführung des Bauvorhabens – Straße / Hausnummer",108.0,187.0,90.0,4.0,8.5],
  ["p5.execution.zip","p5.execution","value","content","Während der Ausführung des Bauvorhabens – Postleitzahl",108.0,191.0,18.0,4.0,8.5],
  ["p5.execution.city","p5.execution","value","content","Während der Ausführung des Bauvorhabens – Ort",128.0,191.0,70.0,4.0,8.5],
  ["p5.execution.phone","p5.execution","value","content","Während der Ausführung des Bauvorhabens – Telefon",108.0,195.0,90.0,4.0,8.5],
  ["p5.execution.email","p5.execution","value","content","Während der Ausführung des Bauvorhabens – E-Mail",108.0,199.0,90.0,4.0,8.5],
  ["p6.start.label","p6","label","fieldLabel","Beginn",12.0,211.0,30.0,5.0,8.5],
  ["p6.start.value","p6","value","content","Voraussichtlicher Beginn",44.0,211.0,55.0,5.0,9.0],
  ["p6.duration.label","p6","label","fieldLabel","Voraussichtliche Dauer",108.0,211.0,58.0,5.0,8.5],
  ["p6.duration.value","p6","value","content","Dauer in ganzen Monaten",168.0,211.0,14.0,5.0,9.0],
  ["p6.duration.unit","p6","label","fieldLabel","Monate",184.0,211.0,14.0,5.0,8.0],
  ["p7.value","p7","value","content","Höchstzahl Beschäftigte",12.0,227.0,186.0,5.0,9.0],
  ["p8.employers.label","p8","label","fieldLabel","Anzahl Arbeitgeber",12.0,242.0,69.0,7.0,8.5],
  ["p8.employers.value","p8","value","content","Anzahl Arbeitgeber",83.0,242.0,20.0,7.0,9.0],
  ["p8.selfEmployed.label","p8","label","fieldLabel","Anzahl Unternehmer ohne Beschäftigte",108.0,242.0,67.0,7.0,8.0],
  ["p8.selfEmployed.value","p8","value","content","Anzahl Unternehmer ohne Beschäftigte",178.0,242.0,20.0,7.0,9.0],
  ["p9.value","p9","value","content","Firmenangabe / Anlagenverweis",12.0,258.0,186.0,4.0,9.0],
  ["signature","body","group","layout","Handschriftlicher Abschluss",12.0,264.0,186.0,18.0,null],
  ["signature.placeDate","signature","group","layout","Ort / Datum",12.0,264.0,80.0,18.0,null],
  ["signature.placeDate.blank","signature.placeDate","area","layout","Ort / Datum – Leerbereich",12.0,264.0,80.0,13.0,null],
  ["signature.placeDate.label","signature.placeDate","label","fieldLabel","Ort / Datum",12.0,278.0,80.0,4.0,8.0],
  ["signature.signer","signature","group","layout","Bauherr / Beauftragter Dritter",112.0,264.0,86.0,18.0,null],
  ["signature.signer.blank","signature.signer","area","layout","Bauherr / Beauftragter Dritter – Leerbereich",112.0,264.0,86.0,13.0,null],
  ["signature.signer.label","signature.signer","label","fieldLabel","Bauherr / Beauftragter Dritter",112.0,278.0,86.0,4.0,8.0]
];
const id = suffix => SCOPE_ID + (suffix ? "." + suffix : "");
const selectors = { "": ".printRoot", page: ".page", globalHeader: ".v2GlobalHeaderBlock", fullHeader: ".v2HeaderFull", body: ".sigekoVaBody" };
const elements = DECLARATIONS.map(([suffix, parent, kind, role, name, x, y, width, height, fontSize], order) => {
  const capabilities = fontSize === null ? [] : ["textResize"];
  const pageArea = ["", "page"].includes(suffix) ? "document" : ["globalHeader", "fullHeader"].includes(suffix) ? "header" : "body";
  return { id: id(suffix), scopeId: SCOPE_ID, parentId: parent === null ? null : id(parent), kind, role, name, order,
    pageArea, visible: true, editable: capabilities.length > 0, capabilities, allowedOps: capabilities,
    lockedOps: [...PDF_TARGET_OPERATIONS.filter(op => !capabilities.includes(op)), "changeText", "modifyDomainData", "setPageBreakRule", "changePageAssignment", "create", "delete", "save", "upload", "import", "export", "autosave", "invokeDomainAction"],
    baseline: { x, y, width, height, visible: true, ...(fontSize === null ? {} : { fontSize, lineSpacing: 1.15, textAlignment: "left" }) },
    layoutBounds: { minX: pageArea === "document" ? 0 : 12, maxX: pageArea === "document" ? 210 : 198,
      minY: pageArea === "document" ? 0 : 5, maxY: pageArea === "document" ? 297 : 285,
      minWidth: 1, maxWidth: pageArea === "document" ? 210 : 186, minHeight: 1, maxHeight: pageArea === "document" ? 297 : 280,
      ...(fontSize === null ? {} : { minFontSize: 8, maxFontSize: suffix === "title" ? 14 : 12 }) },
    refKey: "sigekoVaPdf." + (suffix || "document"), rendererKey: selectors[suffix] || `[data-sigeko-va-pdf="${suffix}"]` };
});
const base = { applicationId: "bbm-produktiv", documentTypeId: DOCUMENT_TYPE_ID, displayName: "Vorankündigung", scopeId: SCOPE_ID,
  unit: "mm", registryVersion: 1, layoutModel: "fixed-layout",
  pageSettings: { format: "A4", orientation: "portrait", width: 210, height: 297, margins: { top: 5, right: 12, bottom: 0, left: 12 } }, elements };
const REGISTRY = { ...base, registryFingerprint: createPdfRegistryFingerprint(base) };
function createSigekoPreNotificationPdfAdapter() {
  return createDeclarativePdfAdapter({ applicationId: "bbm-produktiv", documentTypeId: DOCUMENT_TYPE_ID,
    displayName: "Vorankündigung", registry: REGISTRY, documentIdentityFields: ["projectId", "documentId"] });
}
function buildRegenerationRequest(context) {
  const request = context.providerRequest;
  if (context.documentTypeId !== DOCUMENT_TYPE_ID || !request || request.projectId !== context.projectId ||
      request.documentId !== context.documentId || request.moduleId !== "sigeko" || request.providerId !== DOCUMENT_TYPE_ID) {
    throw new Error("Expliziter Vorankündigungskontext für PDF-Regeneration fehlt.");
  }
  return { mode: "provider", documentTypeId: DOCUMENT_TYPE_ID, projectId: context.projectId, documentId: context.documentId,
    providerRequest: structuredClone(request), targetDir: "temp", fileName: "Vorankuendigung-Editor.pdf" };
}
registerPdfEditorAdapter({ documentTypeId: DOCUMENT_TYPE_ID, moduleId: "sigeko", scopeId: SCOPE_ID,
  profileStorageKey: "module-sigeko-vorankuendigung", displayName: "Vorankündigung", contractVersion: PDF_TARGET_CONTRACT_VERSION,
  printModes: [], adapter: createSigekoPreNotificationPdfAdapter(), builtIn: true, buildRegenerationRequest });
module.exports = { DOCUMENT_TYPE_ID, SCOPE_ID, REGISTRY, createSigekoPreNotificationPdfAdapter, buildRegenerationRequest };
