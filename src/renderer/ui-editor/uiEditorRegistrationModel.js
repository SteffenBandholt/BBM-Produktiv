import { aggregateBbmM83Components } from "./m83ComponentContract.js";

function blockedScope(scopeId, name, reason = "registration_inventory_pending") {
  return Object.freeze({ scopeId, name, status: "blocked", inventoryStatus: "notInventoried", componentIds: Object.freeze([]), expectedElementIds: Object.freeze([]), elements: Object.freeze([]), reason });
}

export function createUiEditorRegistrationModel(registrations, { blockedScopes = [] } = {}) {
  const normalizedRegistrations = Object.freeze([...(registrations || [])]
    .filter(Boolean)
    .sort((left, right) => Number(left.registryOrder || 0) - Number(right.registryOrder || 0)));
  const componentContracts = Object.freeze(normalizedRegistrations.flatMap((entry) => entry.componentContracts || []));
  const aggregate = aggregateBbmM83Components(componentContracts);
  const activeScopes = Object.freeze(normalizedRegistrations.flatMap((entry) => entry.scopeIds || []));
  const activeScopeGroups = Object.freeze(normalizedRegistrations.map((entry) => Object.freeze([...(entry.scopeIds || [])])));
  const completeScope = (scopeId) => {
    const components = aggregate.components.filter((component) => component.scopeId === scopeId);
    const elements = aggregate.elements.filter((entry) => entry.scopeId === scopeId);
    return Object.freeze({
      scopeId,
      status: "complete",
      inventoryStatus: "componentContractComplete",
      componentIds: Object.freeze(components.map((component) => component.componentId)),
      expectedElementIds: Object.freeze(elements.map((entry) => entry.id)),
      elements: Object.freeze(elements),
    });
  };
  const allBlockedScopes = [
    ...blockedScopes,
    ...normalizedRegistrations.flatMap((entry) => entry.blockedScopes || []),
  ];
  const scopes = Object.freeze([
    ...activeScopes.map(completeScope),
    ...allBlockedScopes.map((entry) => blockedScope(entry.scopeId, entry.name, entry.reason)),
  ]);
  const entries = new Map(aggregate.elements.map((entry) => [entry.id, entry]));
  const components = new Map(aggregate.components.map((component) => [component.componentId, component]));
  return Object.freeze({
    registryVersion: Math.max(1, ...normalizedRegistrations.map((entry) => Number(entry.registryVersion) || 0)),
    registrations: normalizedRegistrations,
    componentContracts,
    aggregate,
    activeScopes,
    activeScopeGroups,
    scopes,
    getEntry: (id) => entries.get(String(id || "")) || null,
    getComponent: (id) => components.get(String(id || "")) || null,
    getScopeGroup(scopeId) {
      const registration = normalizedRegistrations.find((entry) => (entry.scopeIds || []).includes(String(scopeId || "").trim()));
      return registration || null;
    },
    getLauncher(scopeId) {
      for (const registration of normalizedRegistrations) {
        const launcher = (registration.launchers || []).find((entry) => entry.scopeId === String(scopeId || "").trim());
        if (launcher) return launcher;
      }
      return null;
    },
    profileMigrations: Object.freeze(normalizedRegistrations.flatMap((entry) => entry.profileMigrations || [])),
  });
}
