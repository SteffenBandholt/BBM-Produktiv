"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { importEsmFromFile } = require("./_esmLoader.cjs");
const { createOutlookDraftHandler, buildOutlookDraftScript, DRAFT_MARKER } = require("../../src/main/ipc/mailIpc");

async function runMailDraftBoundaryTests(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-mail-test-"));
  const attachment = path.join(root, "Anlage ä.pdf");
  const other = path.join(root, "Zweite.pdf");
  fs.writeFileSync(attachment, "unchanged attachment");
  fs.writeFileSync(other, "second attachment");
  const request = () => ({ moduleId: "sigeko", to: ["test@example.invalid"], subject: "Test", body: "Text", attachments: [attachment] });
  function setup({ modules = ["sigeko"], behavior = "success", platform = "win32" } = {}) {
    const calls = [];
    const guards = [];
    const handler = createOutlookDraftHandler({ app: { getPath: () => root }, platform, timeoutMs: 10,
      enforce: (id) => { guards.push(id); if (!modules.includes(id)) throw Object.assign(new Error(`FEATURE_NOT_ALLOWED:${id}`), { licenseError: true }); },
      licenseError: (err) => ({ ok: false, licenseError: true, error: err.message }),
      spawnImpl: (command, args, options) => {
        calls.push({ command, args, options, script: fs.readFileSync(args[args.indexOf("-File") + 1], "utf8"),
          data: JSON.parse(fs.readFileSync(args[args.indexOf("-PayloadPath") + 1], "utf8")) });
        if (behavior === "throw") throw new Error("spawn failed");
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        child.kill = () => { child.emit("close", null); return true; };
        queueMicrotask(() => {
          if (behavior === "timeout") return;
          if (behavior === "error") { child.emit("error", new Error("COM unavailable")); child.emit("close", 0); return; }
          if (behavior !== "no-marker") child.stdout.emit("data", `${DRAFT_MARKER}\r\n`);
          if (behavior === "nonzero") child.stderr.emit("data", "missing attachment during COM");
          child.emit("close", behavior === "signal" ? null : behavior === "nonzero" ? 1 : 0);
        });
        return child;
      },
    });
    return { handler, guards, calls };
  }
  const invoke = async (fixture, payload = request()) => {
    const result = await fixture.handler({}, payload);
    assert.deepEqual(fs.readdirSync(root).sort(), [path.basename(attachment), path.basename(other)].sort(), "temporary scripts cleaned; original attachments retained");
    return result;
  };
  try {
    await run("S1.5: SiGeKo-only permission opens the common adapter with explicit draft outcome", async () => {
      const f = setup();
      assert.deepEqual(await invoke(f), { ok: true, outcome: "draft-opened", transport: "outlook" });
      assert.deepEqual(f.guards, ["sigeko"]);
      assert.equal(f.calls.length, 1);
    });
    await run("S1.5: denied module cannot start transport or access attachments", async () => {
      const f = setup({ modules: ["protokoll"] });
      const result = await invoke(f, { ...request(), attachments: ["missing.pdf"] });
      assert.equal(result.licenseError, true); assert.equal(f.calls.length, 0);
    });
    await run("S1.5: unknown, blank and incapable modules never fall back to Protokoll", async () => {
      for (const id of ["", null, false, {}, "unknown", "restarbeiten", " SiGeKo ", "__proto__"]) {
        const f = setup({ modules: ["protokoll", "sigeko", "restarbeiten"] });
        const result = await invoke(f, { ...request(), moduleId: id });
        assert.equal(result.ok, false); assert.deepEqual(f.guards, []); assert.equal(f.calls.length, 0);
      }
    });
    await run("S1.5: omitted legacy identity still requires Protokoll permission", async () => {
      const payload = request(); delete payload.moduleId;
      const denied = setup(); assert.equal((await invoke(denied, payload)).licenseError, true);
      assert.deepEqual(denied.guards, ["protokoll"]);
      const allowed = setup({ modules: ["protokoll"] }); assert.equal((await invoke(allowed, payload)).outcome, "draft-opened");
    });
    await run("S1.5: recipients, Unicode, newlines, quotes and all deduplicated attachments remain data", async () => {
      const f = setup();
      const payload = { ...request(), to: "one@example.invalid; two@example.invalid", subject: '  Ä "x" $() -Command  ', body: "Hallo\n`$() ä".repeat(10000), attachments: [attachment, other, attachment], attachmentPath: other };
      await invoke(f, payload);
      assert.deepEqual(f.calls[0].data, { to: "one@example.invalid; two@example.invalid", subject: payload.subject.trim(), body: payload.body, attachments: [attachment, other] });
      assert.equal(f.calls[0].args.includes(payload.body), false);
      assert.equal(f.calls[0].command, "powershell.exe");
      assert.equal(fs.readFileSync(attachment, "utf8"), "unchanged attachment");
    });
    await run("S1.5: legacy single attachmentPath remains supported", async () => {
      const f = setup(); const payload = request(); delete payload.attachments; payload.attachmentPath = attachment;
      assert.equal((await invoke(f, payload)).ok, true); assert.deepEqual(f.calls[0].data.attachments, [attachment]);
    });
    await run("S1.5: missing, relative and directory attachments are rejected before PowerShell", async () => {
      for (const attachments of [[], [path.join(root, "missing.pdf")], [root], ["relative.pdf"]]) {
        const f = setup(); const result = await invoke(f, { ...request(), attachments });
        assert.equal(result.ok, false); assert.equal(result.outcome, undefined); assert.equal(f.calls.length, 0);
      }
    });
    await run("S1.5: unsupported platform does not claim a draft or bypass permission", async () => {
      const f = setup({ platform: "linux" }); assert.equal((await invoke(f)).code, "MAIL_PLATFORM_UNSUPPORTED");
      assert.deepEqual(f.guards, ["sigeko"]); assert.equal(f.calls.length, 0);
    });
    for (const behavior of ["throw", "error", "nonzero", "signal", "no-marker", "timeout"]) {
      await run(`S1.5: ${behavior} produces no draft success and cleans temporary script`, async () => {
        const result = await invoke(setup({ behavior })); assert.equal(result.ok, false); assert.equal(result.outcome, undefined);
      });
    }
    await run("S1.5: PowerShell fails on vanished attachments and acknowledges only after Display", () => {
      const script = buildOutlookDraftScript();
      assert.match(script, /Test-Path -LiteralPath \$att -PathType Leaf/);
      assert.match(script, /throw "Anhang nicht gefunden/);
      assert.ok(script.indexOf("Attachments.Add") < script.indexOf("$mail.Display()"));
      assert.ok(script.indexOf("$mail.Display()") < script.indexOf(DRAFT_MARKER));
      assert.doesNotMatch(script, /\$mail\.(Send|Save)\(/);
    });
    const { MailTransportService } = await importEsmFromFile(path.join(process.cwd(), "src/renderer/features/mail/MailTransportService.js"));
    await run("S1.5: module transport reaches the same IPC payload without a domain header", async () => {
      const f = setup();
      const service = new MailTransportService({ createOutlookDraft: (payload) => f.handler({}, payload) });
      const result = await service.openDraft({ moduleId: "sigeko", recipients: ["test@example.invalid"], attachments: [attachment] });
      assert.equal(result.outcome, "draft-opened"); assert.deepEqual(f.guards, ["sigeko"]);
    });
    await run("S1.5: module send cannot bypass permission through forceMailto", async () => {
      let mailto = 0;
      const service = new MailTransportService({ createOutlookDraft: async () => ({ ok: false, licenseError: true }), sendMailto: () => { mailto++; } });
      assert.equal((await service.send({ moduleId: "sigeko", forceMailto: true })).licenseError, true);
      assert.equal(mailto, 0);
    });
    await run("S1.5: renderer refuses ambiguous ok, missing bridge and missing module", async () => {
      for (const value of [undefined, { ok: true }, { ok: true, outcome: "sent", transport: "outlook" }]) {
        const service = new MailTransportService({ createOutlookDraft: async () => value });
        assert.equal((await service.openDraft({ moduleId: "sigeko" })).code, "MAIL_DRAFT_NOT_CONFIRMED");
        assert.equal((await service.openDraft({})).code, "MAIL_MODULE_REQUIRED");
      }
    });
    await run("S1.5: renderer preserves explicit failure and exception without fallback", async () => {
      const failure = { ok: false, cancelled: true };
      assert.deepEqual(await new MailTransportService({ createOutlookDraft: async () => failure }).openDraft({ moduleId: "sigeko" }), failure);
      assert.equal((await new MailTransportService({ createOutlookDraft: async () => { throw new Error("IPC closed"); } }).openDraft({ moduleId: "sigeko" })).ok, false);
    });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
module.exports = { runMailDraftBoundaryTests };
