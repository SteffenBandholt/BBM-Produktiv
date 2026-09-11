"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { createOutlookReminderDraftHandler, buildDraftScript, buildTaskScript, READY, CLOSED, TASK_SAVED } = require("../../src/main/mail/outlookReminderDraft.cjs");

async function runOutlookReminderDraftTests(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bbm-outlook-reminder-test-"));
  const attachment = path.join(root, "Vorankündigung ä.pdf");
  fs.writeFileSync(attachment, "%PDF- original bytes");
  const payload = () => ({ moduleId: "sigeko", to: ["bauherr@example.invalid"], subject: "Vorankündigung",
    body: "Bitte bis 2030-05-17 an {{RETURN}} zurücksenden.\nÄnderung ` $()", attachments: [attachment],
    returnRequestedBy: "2030-05-17", returnAddressToken: "{{RETURN}}",
    reminder: { subject: "VA schon zurück", body: "Bauvorhaben: Testprojekt" } });
  function setup({ answer = 1, dialogImpl = null, platform = "win32", failOnGuard = 0, draftBehavior = "success", taskBehavior = "success" } = {}) {
    const calls = [], dialogs = [], children = [], guards = [];
    const app = new EventEmitter(); app.getPath = () => root;
    const handler = createOutlookReminderDraftHandler({ app, platform, timeoutMs: 10,
      enforce: id => { guards.push(id); if (guards.length === failOnGuard) throw Object.assign(new Error("FEATURE_NOT_ALLOWED:sigeko"), { licenseError: true }); },
      licenseError: error => ({ ok: false, licenseError: true, error: error.message }),
      showMessageBox: async options => { dialogs.push(options); return dialogImpl ? dialogImpl(options) : { response: answer }; },
      spawnImpl: (command, args, options) => {
        const script = fs.readFileSync(args[args.indexOf("-File") + 1], "utf8");
        const data = JSON.parse(fs.readFileSync(args[args.indexOf("-PayloadPath") + 1], "utf8"));
        const task = script.includes("$outlook.CreateItem(3)");
        const behavior = task ? taskBehavior : draftBehavior;
        if (behavior === "throw") throw new Error("Cannot start PowerShell");
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        child.kill = () => { child.killed = true; child.emit("close", null); };
        children.push(child); calls.push({ command, args, options, script, data, task });
        queueMicrotask(() => {
          if (behavior === "timeout") return;
          if (behavior === "error") { child.emit("error", new Error("COM unavailable")); child.emit("close", 1); return; }
          if (!task) child.stdout.emit("data", `${READY}\r\n`);
          if (behavior === "wait") return;
          if (behavior !== "no-marker") child.stdout.emit("data", `${task ? TASK_SAVED : CLOSED}\r\n`);
          if (behavior === "nonzero") child.stderr.emit("data", "COM failed");
          child.emit("close", behavior === "nonzero" ? 1 : 0);
        });
        return child;
      } });
    return { app, handler, calls, dialogs, children, guards };
  }
  function cleaned() {
    assert.deepEqual(fs.readdirSync(root), [path.basename(attachment)]);
    assert.equal(fs.readFileSync(attachment, "utf8"), "%PDF- original bytes");
  }
  try {
    await run("S5.5 Outlook: closing draft and No never creates a task", async () => {
      const f = setup();
      assert.deepEqual(await f.handler({}, payload()), { ok: true, outcome: "draft-closed", transport: "outlook", reminder: "declined" });
      assert.equal(f.calls.length, 1); assert.equal(f.dialogs.length, 1);
      assert.equal(f.dialogs[0].defaultId, 1); assert.equal(f.dialogs[0].cancelId, 1);
      assert.match(f.dialogs[0].message, /17\.05\.2030/); assert.deepEqual(f.guards, ["sigeko"]);
      assert.equal(f.app.listenerCount("before-quit"), 0); cleaned();
    });
    await run("S5.5 Outlook: Yes creates one reminder after close and a fresh license check", async () => {
      const f = setup({ answer: 0 });
      assert.equal((await f.handler({}, payload())).reminder, "created");
      assert.equal(f.calls.length, 2); assert.equal(f.calls[1].task, true);
      assert.deepEqual(f.guards, ["sigeko", "sigeko"]);
      assert.deepEqual(f.calls[1].data, { subject: "VA schon zurück", body: "Bauvorhaben: Testprojekt", returnRequestedBy: "2030-05-17" });
      cleaned();
    });
    await run("S5.5 Outlook: user editing past startup timeout does not fail or prompt early", async () => {
      const f = setup({ draftBehavior: "wait" });
      const operation = f.handler({}, payload());
      await new Promise(resolve => setTimeout(resolve, 30));
      assert.equal(f.dialogs.length, 0); assert.equal(f.children[0].killed, undefined);
      f.children[0].stdout.emit("data", `${CLOSED}\r\n`); f.children[0].emit("close", 0);
      assert.equal((await operation).reminder, "declined"); cleaned();
    });
    await run("S5.5 Outlook: app exit cancels waiting without prompting or saving a task", async () => {
      const f = setup({ draftBehavior: "wait", answer: 0 });
      const operation = f.handler({}, payload()); await Promise.resolve();
      f.app.emit("before-quit");
      const result = await operation;
      assert.equal(result.code, "MAIL_APP_CLOSED"); assert.equal(f.dialogs.length, 0);
      assert.equal(f.children[0].killed, true); assert.equal(f.app.listenerCount("before-quit"), 0); cleaned();
    });
    await run("S5.5 Outlook: permission revoked during editing prevents task creation", async () => {
      const f = setup({ answer: 0, failOnGuard: 2 });
      const result = await f.handler({}, payload());
      assert.equal(result.licenseError, true); assert.equal(result.outcome, "draft-closed");
      assert.equal(result.reminder, "failed"); assert.equal(f.calls.length, 1); cleaned();
    });
    await run("S5.5 Outlook: app quit during reminder question blocks a later Yes and removes listener", async () => {
      let enteredQuestion, answerQuestion;
      const entered = new Promise(resolve => { enteredQuestion = resolve; });
      const answer = new Promise(resolve => { answerQuestion = resolve; });
      const f = setup({ dialogImpl: () => { enteredQuestion(); return answer; } });
      const operation = f.handler({}, payload());
      await entered;
      assert.equal(f.calls.length, 1); assert.equal(f.app.listenerCount("before-quit"), 1);
      f.app.emit("before-quit"); answerQuestion({ response: 0 });
      const result = await operation;
      assert.equal(result.code, "MAIL_APP_CLOSED"); assert.equal(result.outcome, "draft-closed");
      assert.equal(result.reminder, "failed"); assert.equal(f.calls.length, 1);
      assert.equal(f.app.listenerCount("before-quit"), 0); assert.deepEqual(f.guards, ["sigeko"]); cleaned();
    });
    await run("S5.5 Outlook: year zero is rejected before opening draft or asking about reminder", async () => {
      const f = setup({ answer: 0 });
      const result = await f.handler({}, { ...payload(), returnRequestedBy: "0000-01-01" });
      assert.equal(result.code, "MAIL_REQUEST_INVALID"); assert.equal(f.calls.length, 0); assert.equal(f.dialogs.length, 0);
      assert.equal(f.app.listenerCount("before-quit"), 0); cleaned();
    });
    await run("S5.5 Outlook: unavailable module and permission denial precede file access", async () => {
      for (const moduleId of [undefined, null, "", "restarbeiten", "unknown", "__proto__", "SiGeKo"]) {
        const f = setup(); const result = await f.handler({}, { ...payload(), moduleId, attachments: ["missing.pdf"] });
        assert.equal(result.code, "MAIL_CAPABILITY_MISSING"); assert.equal(f.calls.length, 0); assert.equal(f.guards.length, 0);
      }
      const f = setup({ failOnGuard: 1 });
      assert.equal((await f.handler({}, { ...payload(), attachments: ["missing.pdf"] })).licenseError, true);
      assert.equal(f.calls.length, 0); cleaned();
    });
    await run("S5.5 Outlook: unsupported OS cannot start PowerShell", async () => {
      const f = setup({ platform: "linux" });
      assert.equal((await f.handler({}, payload())).code, "MAIL_PLATFORM_UNSUPPORTED");
      assert.equal(f.calls.length, 0); assert.deepEqual(f.guards, ["sigeko"]); cleaned();
    });
    await run("S5.5 Outlook: invalid dates, addresses, template and attachments cannot open draft", async () => {
      for (const patch of [{ returnRequestedBy: "2030-02-30" }, { returnRequestedBy: null }, { to: [] },
        { to: ["wrong"] }, { subject: "X\r\nInjected" }, { returnAddressToken: "absent" },
        { attachments: [] }, { attachments: [root] }, { attachments: ["relative.pdf"] }, { reminder: { subject: "x", body: null } }]) {
        const f = setup(); assert.equal((await f.handler({}, { ...payload(), ...patch })).ok, false);
        assert.equal(f.calls.length, 0); assert.equal(f.dialogs.length, 0);
      }
      cleaned();
    });
    for (const behavior of ["throw", "error", "timeout", "nonzero", "no-marker"]) {
      await run(`S5.5 Outlook: draft ${behavior} never prompts or infers closure`, async () => {
        const f = setup({ draftBehavior: behavior, answer: 0 });
        const result = await f.handler({}, payload());
        assert.equal(result.ok, false); assert.equal(result.outcome, undefined);
        assert.equal(f.dialogs.length, 0); cleaned();
      });
      await run(`S5.5 Outlook: task ${behavior} reports reminder failure after closure without retry`, async () => {
        const f = setup({ taskBehavior: behavior, answer: 0 });
        const result = await f.handler({}, payload());
        assert.equal(result.ok, false); assert.equal(result.outcome, "draft-closed");
        assert.equal(result.reminder, "failed"); assert.equal(f.calls.length, behavior === "throw" ? 1 : 2); cleaned();
      });
    }
    await run("S5.5 Outlook: Unicode and shell syntax stay JSON data; duplicate attachments collapse", async () => {
      const f = setup(); const value = { ...payload(), attachments: [attachment, attachment] };
      await f.handler({}, value);
      assert.equal(f.calls[0].data.body, value.body); assert.equal(f.calls[0].data.attachments.length, 1);
      assert.equal(f.calls[0].args.includes(value.body), false); assert.equal(f.calls[0].command, "powershell.exe"); cleaned();
    });
    await run("S5.5 Outlook: script contracts resolve sender, await modal close, save only task", () => {
      const draft = buildDraftScript(), task = buildTaskScript();
      assert.match(draft, /\$mail\.SendUsingAccount/); assert.match(draft, /\$account\.SmtpAddress/);
      assert.match(draft, /\.Replace\(\[string\]\$payload\.returnAddressToken, \$address\)/);
      assert.ok(draft.indexOf("Attachments.Add") < draft.indexOf("$mail.Display($true)"));
      assert.ok(draft.indexOf("$mail.Display($true)") < draft.indexOf(CLOSED));
      assert.doesNotMatch(draft, /\$mail\.(Send|Save)\(|ItemSend|SentOn|\.Quit\(/);
      assert.match(task, /CreateItem\(3\)/); assert.match(task, /ReminderTime = \$due\.Date\.AddHours\(9\)/);
      assert.match(task, /ReminderSet = \$true/); assert.ok(task.indexOf("$task.Save()") < task.indexOf(TASK_SAVED));
      assert.doesNotMatch(task, /\.Send\(|\.Assign\(/);
    });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
module.exports = { runOutlookReminderDraftTests };
if (require.main === module) runOutlookReminderDraftTests(async (name, action) => { await action(); console.log(`PASS ${name}`); }).catch(error => { console.error(error); process.exitCode = 1; });
