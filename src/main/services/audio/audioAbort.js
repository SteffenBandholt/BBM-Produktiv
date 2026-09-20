function createAudioAbortError() {
  const error = new Error("Audioimport abgebrochen");
  error.name = "AbortError";
  error.audioImportCanceled = true;
  return error;
}

function isAudioAbortError(error) {
  return error?.name === "AbortError" || error?.audioImportCanceled === true;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw createAudioAbortError();
}

module.exports = {
  createAudioAbortError,
  isAudioAbortError,
  throwIfAborted,
};
