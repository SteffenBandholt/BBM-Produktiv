function asNonEmptyString(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new TypeError(`Moduldeskriptor: ${fieldName} darf nicht leer sein.`);
  }
  return normalized;
}

function freezeRouteMap(routes = {}) {
  const normalized = {};
  for (const scope of ["global", "project"]) {
    const entries = Array.isArray(routes?.[scope]) ? routes[scope] : [];
    normalized[scope] = Object.freeze(
      entries.map((entry) =>
        Object.freeze({
          ...entry,
          screenId: asNonEmptyString(entry?.screenId, `routes.${scope}.screenId`),
        })
      )
    );
  }
  return Object.freeze(normalized);
}

function freezeNavigation(navigation = {}) {
  const normalized = {};
  for (const scope of ["global", "project"]) {
    const entries = Array.isArray(navigation?.[scope]) ? navigation[scope] : [];
    normalized[scope] = Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
  }
  return Object.freeze(normalized);
}

function freezeCapabilities(capabilities = []) {
  if (!Array.isArray(capabilities)) {
    throw new TypeError("Moduldeskriptor: requiredCapabilities muss ein Array sein.");
  }
  return Object.freeze(
    [...new Set(capabilities.map((value) => asNonEmptyString(value, "requiredCapabilities")))]
  );
}

export function createModuleDescriptor(definition = {}) {
  const moduleType = asNonEmptyString(definition.moduleType, "moduleType");
  if (!["global", "project", "hybrid"].includes(moduleType)) {
    throw new TypeError(`Moduldeskriptor: unbekannter moduleType ${moduleType}.`);
  }

  const descriptor = {
    ...definition,
    moduleId: asNonEmptyString(definition.moduleId, "moduleId"),
    moduleLabel: asNonEmptyString(definition.moduleLabel, "moduleLabel"),
    moduleType,
    licenseKey: asNonEmptyString(definition.licenseKey, "licenseKey"),
    routes: freezeRouteMap(definition.routes),
    navigation: freezeNavigation(definition.navigation),
    ipcRegistrar: asNonEmptyString(definition.ipcRegistrar, "ipcRegistrar"),
    migrationRegistrar: asNonEmptyString(definition.migrationRegistrar, "migrationRegistrar"),
    requiredCapabilities: freezeCapabilities(definition.requiredCapabilities),
  };

  if (!descriptor.screens || typeof descriptor.screens !== "object") {
    throw new TypeError("Moduldeskriptor: screens muss ein Objekt sein.");
  }

  for (const scope of ["global", "project"]) {
    for (const route of descriptor.routes[scope]) {
      if (!descriptor.screens[route.screenId]) {
        throw new TypeError(
          `Moduldeskriptor ${descriptor.moduleId}: Route ${route.screenId} hat keinen Screen.`
        );
      }
    }
  }

  return Object.freeze(descriptor);
}
