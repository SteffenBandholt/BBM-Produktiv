export function getElementAllowedOps(element = null) {
  return Array.isArray(element?.allowedOps)
    ? element.allowedOps.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
}

export function getElementLockedOps(element = null) {
  return Array.isArray(element?.lockedOps)
    ? element.lockedOps.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
}

export function getChangeRequestOperation(operation = "") {
  if (operation === "resizeWidth") return "width";
  if (operation === "resizeHeight") return "height";
  if (operation === "hide" || operation === "show") return "visibility";
  return operation;
}

export function isPreviewOperationAllowed(element = null, operation = "") {
  const normalizedOperation = String(operation || "").trim();
  const allowedOps = getElementAllowedOps(element);
  const lockedOps = getElementLockedOps(element);
  if (!normalizedOperation || lockedOps.includes(normalizedOperation)) return false;
  if (normalizedOperation === "resizeWidth") {
    if (lockedOps.includes("width")) return false;
    if (allowedOps.includes("width")) return true;
    if (lockedOps.includes("resize")) return false;
    return allowedOps.includes("resize");
  }
  if (normalizedOperation === "resizeHeight") {
    if (lockedOps.includes("height")) return false;
    if (allowedOps.includes("height")) return true;
    if (lockedOps.includes("resize")) return false;
    return allowedOps.includes("resize");
  }
  return allowedOps.includes(normalizedOperation);
}
