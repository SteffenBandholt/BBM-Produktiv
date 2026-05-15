const assert = require("node:assert/strict");
const {
  normalizePrintOrientation,
  createPrintToPdfOptions,
  resolvePrintRequestedOrientation,
} = require("../../src/main/print/printOrientation");

async function runPrintOrientationTests(run) {
  await run("print orientation defaults to portrait", () => {
    assert.equal(normalizePrintOrientation(), "portrait");
    assert.equal(normalizePrintOrientation(undefined), "portrait");
    assert.equal(normalizePrintOrientation(null), "portrait");
  });

  await run("print orientation accepts landscape only", () => {
    assert.equal(normalizePrintOrientation("landscape"), "landscape");
    assert.equal(normalizePrintOrientation("LANDSCAPE"), "landscape");
    assert.equal(normalizePrintOrientation("portrait"), "portrait");
    assert.equal(normalizePrintOrientation("foo"), "portrait");
  });

  await run("printToPdf options follow orientation", () => {
    assert.equal(createPrintToPdfOptions().landscape, false);
    assert.equal(createPrintToPdfOptions({ orientation: "portrait" }).landscape, false);
    assert.equal(createPrintToPdfOptions({ orientation: "landscape" }).landscape, true);
  });

  await run("smoke override wins over normal orientation", () => {
    assert.equal(
      resolvePrintRequestedOrientation({ orientation: "portrait", smokeOrientation: "landscape" }),
      "landscape"
    );
    assert.equal(
      resolvePrintRequestedOrientation({ orientation: "landscape", testOrientation: "portrait" }),
      "portrait"
    );
    assert.equal(
      resolvePrintRequestedOrientation({ orientation: "landscape" }),
      "landscape"
    );
  });
}

module.exports = { runPrintOrientationTests };
