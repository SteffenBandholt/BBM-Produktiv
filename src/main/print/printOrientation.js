function normalizePrintOrientation(value) {
  const s = String(value || "").trim().toLowerCase();
  return s === "landscape" ? "landscape" : "portrait";
}

function isLandscapeOrientation(value) {
  return normalizePrintOrientation(value) === "landscape";
}

function createPrintToPdfOptions({ orientation } = {}) {
  const normalizedOrientation = normalizePrintOrientation(orientation);
  return {
    printBackground: true,
    landscape: normalizedOrientation === "landscape",
    pageSize: "A4",
    displayHeaderFooter: false,
    margin: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  };
}

module.exports = {
  normalizePrintOrientation,
  isLandscapeOrientation,
  createPrintToPdfOptions,
};
