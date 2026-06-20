const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function runNativeTestRuntimeTests(run) {
  run("Native Test Runtime: package scripts und Wrapper bleiben stabil", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");
    const packageJsonPath = path.join(repoRoot, "package.json");
    const wrapperPath = path.join(repoRoot, "scripts", "runElectronNodeTest.cjs");

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const wrapperContent = fs.readFileSync(wrapperPath, "utf8");

    assert.ok(pkg.scripts?.test, "package.json scripts.test fehlt");
    assert.equal(pkg.scripts.test, "node --max-old-space-size=8192 scripts/runElectronNodeTest.cjs");
    assert.notEqual(pkg.scripts.test, "node scripts/test.cjs");

    assert.ok(pkg.scripts?.["test:node"], "package.json scripts.test:node fehlt");
    assert.equal(pkg.scripts["test:node"], "node scripts/test.cjs");

    assert.match(wrapperContent, /ELECTRON_RUN_AS_NODE/);
    assert.match(wrapperContent, /--max-old-space-size=8192/);
    assert.match(wrapperContent, /electron\.exe/);
    assert.match(wrapperContent, /".bin"/);
    assert.match(wrapperContent, /"electron"/);
    assert.match(wrapperContent, /test\.cjs/);
    assert.doesNotMatch(wrapperContent, /require\(["']better-sqlite3["']\)/);
    assert.doesNotMatch(wrapperContent, /electron-builder install-app-deps/);

    assert.equal(pkg.scripts.postinstall, "electron-builder install-app-deps");
    assert.equal(pkg.scripts["fix:electron-deps"], "electron-builder install-app-deps");
  });
}

module.exports = { runNativeTestRuntimeTests };
