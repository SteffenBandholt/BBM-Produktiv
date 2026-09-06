const PROVIDER_KINDS = Object.freeze({
  PDF_DOCUMENT: "pdf-document",
  MAIL_PAYLOAD: "mail-payload",
  EXPORT: "export",
});

const CAPABILITY_BY_KIND = Object.freeze({
  [PROVIDER_KINDS.PDF_DOCUMENT]: "pdf",
  [PROVIDER_KINDS.MAIL_PAYLOAD]: "mail",
  [PROVIDER_KINDS.EXPORT]: "export",
});

function requiredText(value, label) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new TypeError(`${label} fehlt.`);
  return normalized;
}

function createProvider(kind, { moduleId, type, provide } = {}) {
  const normalizedKind = requiredText(kind, "Provider-Art");
  if (!Object.values(PROVIDER_KINDS).includes(normalizedKind)) {
    throw new TypeError(`Unbekannte Provider-Art: ${normalizedKind}`);
  }
  const normalizedModuleId = requiredText(moduleId, "Modul-ID");
  const normalizedType = requiredText(type, "Fachtyp");
  if (typeof provide !== "function") throw new TypeError("Provider-Funktion fehlt.");

  return Object.freeze({
    kind: normalizedKind,
    capability: CAPABILITY_BY_KIND[normalizedKind],
    moduleId: normalizedModuleId,
    type: normalizedType,
    provide,
  });
}

function PdfDocumentProvider(definition) {
  return createProvider(PROVIDER_KINDS.PDF_DOCUMENT, definition);
}

function MailPayloadProvider(definition) {
  return createProvider(PROVIDER_KINDS.MAIL_PAYLOAD, definition);
}

function ExportProvider(definition) {
  return createProvider(PROVIDER_KINDS.EXPORT, definition);
}

function providerKey({ kind, moduleId, type }) {
  return [kind, moduleId, type].map((value) => requiredText(value, "Provider-Schluessel")).join(":");
}

function createServiceProviderRegistry({ moduleDefinitions = {} } = {}) {
  const providers = new Map();

  function register(provider) {
    const capability = CAPABILITY_BY_KIND[provider?.kind];
    if (!capability || provider?.capability !== capability || typeof provider?.provide !== "function") {
      throw new TypeError("Ungueltiger Service-Provider.");
    }
    const definition = moduleDefinitions[provider.moduleId];
    const requiredCapabilities = definition?.requiredCapabilities || [];
    if (!definition || !requiredCapabilities.includes(capability)) {
      throw new Error(`Modul ${provider.moduleId} deklariert Capability ${capability} nicht.`);
    }
    const key = providerKey(provider);
    if (providers.has(key)) throw new Error(`Service-Provider bereits registriert: ${key}`);
    providers.set(key, provider);
    return provider;
  }

  function resolve({ kind, moduleId, type } = {}) {
    return providers.get(providerKey({ kind, moduleId, type })) || null;
  }

  function provide(request = {}) {
    const provider = resolve(request);
    if (!provider) return null;
    return provider.provide(Object.freeze({ ...request, moduleId: provider.moduleId, type: provider.type }));
  }

  function list({ moduleId = "", kind = "" } = {}) {
    return [...providers.values()].filter((provider) =>
      (!moduleId || provider.moduleId === moduleId) && (!kind || provider.kind === kind));
  }

  return Object.freeze({ register, resolve, provide, list });
}

module.exports = Object.freeze({
  PROVIDER_KINDS,
  PdfDocumentProvider,
  MailPayloadProvider,
  ExportProvider,
  createServiceProviderRegistry,
});
