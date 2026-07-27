const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function runNativeTestRuntimeTests(run) {
  run("Native Test Runtime: package scripts und Wrapper bleiben stabil", () => {
    const repoRoot = path.resolve(__dirname, "..", "..");
    const packageJsonPath = path.join(repoRoot, "package.json");
    const wrapperPath = path.join(repoRoot, "scripts", "runElectronNodeTest.cjs");
    const nodeWrapperPath = path.join(repoRoot, "scripts", "runNodeTestsWithAbi.cjs");
    const abiPath = path.join(repoRoot, "scripts", "nativeDepsAbi.cjs");

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const wrapperContent = fs.readFileSync(wrapperPath, "utf8");
    const nodeWrapperContent = fs.readFileSync(nodeWrapperPath, "utf8");
    const abiContent = fs.readFileSync(abiPath, "utf8");

    assert.ok(pkg.scripts?.test, "package.json scripts.test fehlt");
    assert.equal(pkg.scripts.test, "node scripts/runElectronNodeTest.cjs");
    assert.notEqual(pkg.scripts.test, "node scripts/test.cjs");

    assert.ok(pkg.scripts?.["test:node"], "package.json scripts.test:node fehlt");
    assert.equal(pkg.scripts["test:node"], "node scripts/runNodeTestsWithAbi.cjs");

    assert.match(wrapperContent, /ELECTRON_RUN_AS_NODE/);
    assert.match(wrapperContent, /electron\.exe/);
    assert.match(wrapperContent, /".bin"/);
    assert.match(wrapperContent, /"electron"/);
    assert.match(wrapperContent, /runGroupedTests/);
    assert.doesNotMatch(wrapperContent, /require\(["']better-sqlite3["']\)/);
    assert.doesNotMatch(wrapperContent, /electron-builder install-app-deps/);

    assert.match(nodeWrapperContent, /finally/);
    assert.match(nodeWrapperContent, /switchAbi\("electron"\)/);
    assert.match(abiContent, /electron-builder/);
    assert.match(abiContent, /npm_config_runtime:\s*"node"/);
    assert.equal(pkg.scripts.postinstall, "node scripts/nativeDepsAbi.cjs electron");
    assert.equal(pkg.scripts["fix:electron-deps"], "node scripts/nativeDepsAbi.cjs electron");
    assert.match(pkg.scripts.pack, /^npm run fix:electron-deps && /);
  });
}

module.exports = { runNativeTestRuntimeTests };
