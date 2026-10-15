const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runModuleServiceProviderTests(run) {
  const {
    PROVIDER_KINDS,
    PdfDocumentProvider,
    MailPayloadProvider,
    ExportProvider,
    createModuleServiceProviderRegistry,
  } = require(path.join(process.cwd(), "src/main/moduleServiceProviders.js"));

  await run("Paket 6: PDF-Provider trennt Technik von Fach-ViewModel und Layoutregeln", () => {
    const registry = createModuleServiceProviderRegistry();
    registry.register(PdfDocumentProvider({
      moduleId: "protokoll",
      type: "protocol",
      provide: ({ input }) => ({ documentType: "protocol", viewModel: input, layoutRules: { header: "protocol" } }),
    }));
    registry.register(PdfDocumentProvider({
      moduleId: "sigeko",
      type: "report",
      provide: ({ input }) => ({ documentType: "report", viewModel: input, layoutRules: { header: "report" } }),
    }));

    const protocol = registry.provide({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "protokoll", type: "protocol", input: { meetingId: "m1" } });
    const report = registry.provide({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "sigeko", type: "report", input: { reportId: "s1" } });
    assert.deepEqual(protocol, { documentType: "protocol", viewModel: { meetingId: "m1" }, layoutRules: { header: "protocol" } });
    assert.deepEqual(report, { documentType: "report", viewModel: { reportId: "s1" }, layoutRules: { header: "report" } });
  });

  await run("Paket 6: Mail-Provider liefert fachlichen Payload an gemeinsamen Dienst", () => {
    const registry = createModuleServiceProviderRegistry();
    registry.register(MailPayloadProvider({
      moduleId: "sigeko",
      type: "report",
      provide: ({ input }) => ({ to: input.to, subject: `SiGeKo ${input.number}`, attachments: input.files }),
    }));
    assert.deepEqual(
      registry.provide({ kind: PROVIDER_KINDS.MAIL_PAYLOAD, moduleId: "sigeko", type: "report", input: { to: ["a@example.test"], number: "42", files: ["42.pdf"] } }),
      { to: ["a@example.test"], subject: "SiGeKo 42", attachments: ["42.pdf"] }
    );
  });

  await run("Paket 6: Export-Provider kapselt fachliche Exportregeln", () => {
    const registry = createModuleServiceProviderRegistry();
    registry.register(ExportProvider({
      moduleId: "restarbeiten",
      type: "list",
      provide: ({ input }) => ({ fileName: "restarbeiten.csv", rows: input.items }),
    }));
    assert.deepEqual(
      registry.provide({ kind: PROVIDER_KINDS.EXPORT, moduleId: "restarbeiten", type: "list", input: { items: [{ id: "r1" }] } }),
      { fileName: "restarbeiten.csv", rows: [{ id: "r1" }] }
    );
  });

  await run("Paket 6: Provider benoetigt die deklarierte Modul-Capability", () => {
    const registry = createModuleServiceProviderRegistry();
    assert.throws(() => registry.register(MailPayloadProvider({
      moduleId: "restarbeiten",
      type: "notice",
      provide: () => ({}),
    })), /deklariert Capability mail nicht/);
  });

  await run("Paket 6: Provider sind pro Modul und Fachtyp eindeutig", () => {
    const registry = createModuleServiceProviderRegistry();
    const provider = PdfDocumentProvider({ moduleId: "sigeko", type: "report", provide: () => ({}) });
    registry.register(provider);
    assert.throws(() => registry.register(provider), /bereits registriert/);
    assert.equal(registry.resolve({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "protokoll", type: "report" }), null);
  });

  await run("Paket 6: neutrale Providergrenze importiert keine Fachimplementierung", () => {
    const shared = read("src/shared/providers/serviceProviderRegistry.cjs");
    const bridge = read("src/main/moduleServiceProviders.js");
    for (const forbidden of ["protokoll", "restarbeiten", "sigeko", "PrintShell", "MailFlow", "projectTransferIpc"]) {
      assert.equal(shared.includes(forbidden), false, forbidden);
      assert.equal(bridge.includes(forbidden), false, forbidden);
    }
  });
}

module.exports = { runModuleServiceProviderTests };
