export const REQUIRED_HOST_ADAPTER_METHODS = Object.freeze([
  "getRegistry",
  "getCurrentLayoutState",
  "submitChangeRequest",
]);

export function validateHostAdapterShape(adapter) {
  const errors = [];
  for (const methodName of REQUIRED_HOST_ADAPTER_METHODS) {
    if (!adapter || typeof adapter[methodName] !== "function") {
      errors.push({
        code: "HOST_METHOD_MISSING",
        methodName,
        message: `missing host adapter method: ${methodName}`,
      });
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings: [],
  };
}
