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
      moduleId: "rechnung",
      type: "invoice",
      provide: ({ input }) => ({ documentType: "invoice", viewModel: input, layoutRules: { header: "invoice" } }),
    }));

    const protocol = registry.provide({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "protokoll", type: "protocol", input: { meetingId: "m1" } });
    const invoice = registry.provide({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "rechnung", type: "invoice", input: { invoiceId: "i1" } });
    assert.deepEqual(protocol, { documentType: "protocol", viewModel: { meetingId: "m1" }, layoutRules: { header: "protocol" } });
    assert.deepEqual(invoice, { documentType: "invoice", viewModel: { invoiceId: "i1" }, layoutRules: { header: "invoice" } });
  });

  await run("Paket 6: Mail-Provider liefert fachlichen Payload an gemeinsamen Dienst", () => {
    const registry = createModuleServiceProviderRegistry();
    registry.register(MailPayloadProvider({
      moduleId: "rechnung",
      type: "invoice",
      provide: ({ input }) => ({ to: input.to, subject: `Rechnung ${input.number}`, attachments: input.files }),
    }));
    assert.deepEqual(
      registry.provide({ kind: PROVIDER_KINDS.MAIL_PAYLOAD, moduleId: "rechnung", type: "invoice", input: { to: ["a@example.test"], number: "42", files: ["42.pdf"] } }),
      { to: ["a@example.test"], subject: "Rechnung 42", attachments: ["42.pdf"] }
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
    const provider = PdfDocumentProvider({ moduleId: "rechnung", type: "invoice", provide: () => ({}) });
    registry.register(provider);
    assert.throws(() => registry.register(provider), /bereits registriert/);
    assert.equal(registry.resolve({ kind: PROVIDER_KINDS.PDF_DOCUMENT, moduleId: "protokoll", type: "invoice" }), null);
  });

  await run("Paket 6: neutrale Providergrenze importiert keine Fachimplementierung", () => {
    const shared = read("src/shared/providers/serviceProviderRegistry.cjs");
    const bridge = read("src/main/moduleServiceProviders.js");
    for (const forbidden of ["protokoll", "restarbeiten", "rechnung", "PrintShell", "MailFlow", "projectTransferIpc"]) {
      assert.equal(shared.includes(forbidden), false, forbidden);
      assert.equal(bridge.includes(forbidden), false, forbidden);
    }
  });
}

module.exports = { runModuleServiceProviderTests };
