function createAbortError(message = "Transkription abgebrochen.") {
  const error = new Error(message);
  error.name = "AbortError";
  error.code = "ABORT_ERR";
  return error;
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ABORT_ERR";
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAbortError();
}

module.exports = {
  createAbortError,
  isAbortError,
  throwIfAborted,
};
