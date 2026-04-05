const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runTopsCloseFlowTests(run) {
  const { TopsCloseFlow } = await importEsmFromFile(path.join(__dirname, "../../src/renderer/tops/domain/TopsCloseFlow.js"));

  await run("TopsCloseFlow: schliesst Meeting und startet Output/Mail-Flow", async () => {
    const originalWindow = global.window;
    const originalAlert = global.alert;
    const originalConfirm = global.confirm;

    const meetingsCloseCalls = [];
    const printCalls = [];

    global.alert = () => {};
    global.confirm = () => true;
    global.window = {
      bbmDb: {
        async topsPurgeTrashedByMeeting() {
          return { ok: true };
        },
        async meetingsClose(payload) {
          meetingsCloseCalls.push(payload);
          return { ok: true, meeting: { id: 44, is_closed: 1 } };
        },
      },
    };

    try {
      const router = {
        currentProjectId: 77,
        async promptNextMeetingSettings() {
          return {
            cancelled: false,
            data: {
              "print.nextMeeting.enabled": "1",
              "print.nextMeeting.date": "2026-05-01",
              "print.nextMeeting.time": "09:00",
              "print.nextMeeting.place": "Baubude",
              "print.nextMeeting.extra": "Bitte Unterlagen",
            },
          };
        },
        async printClosedMeetingDirect(args) {
          printCalls.push(["protocol", args]);
          return { ok: true, filePath: "C:/tmp/protocol.pdf" };
        },
        async printFirmsDirect(args) {
          printCalls.push(["firms", args]);
          return { ok: true, filePath: "C:/tmp/firms.pdf" };
        },
        async printTodoDirect(args) {
          printCalls.push(["todo", args]);
          return { ok: true, filePath: "C:/tmp/todo.pdf" };
        },
        async printTopListAllDirect(args) {
          printCalls.push(["tops", args]);
          return { ok: true, filePath: "C:/tmp/tops.pdf" };
        },
      };

      const flow = new TopsCloseFlow({ router, projectId: 77, meetingId: 44 });
      flow.setContext({
        projectId: 77,
        meetingId: 44,
        meetingMeta: { id: 44, meeting_date: "2026-04-10" },
        isReadOnly: false,
      });

      let mailCalled = 0;
      flow.mailFlow = {
        async maybePromptSendAfterClose() {
          mailCalled += 1;
        },
      };

      const res = await flow.run();

      assert.equal(res.ok, true);
      assert.equal(meetingsCloseCalls.length, 1);
      assert.equal(meetingsCloseCalls[0].meetingId, 44);
      assert.equal(meetingsCloseCalls[0].nextMeeting.date, "2026-05-01");
      assert.equal(printCalls.length, 4);
      assert.equal(mailCalled, 1);
    } finally {
      global.window = originalWindow;
      global.alert = originalAlert;
      global.confirm = originalConfirm;
    }
  });

  await run("TopsCloseFlow: repariert NUM_GAP und versucht Schliessen erneut", async () => {
    const originalWindow = global.window;
    const originalAlert = global.alert;
    const originalConfirm = global.confirm;

    let closeAttempt = 0;
    const fixCalls = [];

    global.alert = () => {};
    global.confirm = () => true;
    global.window = {
      bbmDb: {
        async topsPurgeTrashedByMeeting() {
          return { ok: true };
        },
        async meetingsClose() {
          closeAttempt += 1;
          if (closeAttempt === 1) {
            return {
              ok: false,
              errorCode: "NUM_GAP",
              gaps: [{ level: 2, parentTopId: 5, lastTopId: 99, missingNumber: 3 }],
            };
          }
          return { ok: true, meeting: { id: 88, is_closed: 1 } };
        },
        async meetingTopsFixNumberGap(payload) {
          fixCalls.push(payload);
          return { ok: true };
        },
      },
    };

    try {
      const router = {
        currentProjectId: 13,
        async promptNextMeetingSettings() {
          return { cancelled: false, data: {} };
        },
      };

      const flow = new TopsCloseFlow({ router, projectId: 13, meetingId: 88 });
      flow.mailFlow = { async maybePromptSendAfterClose() {} };

      const res = await flow.run();

      assert.equal(res.ok, true);
      assert.equal(closeAttempt, 2);
      assert.equal(fixCalls.length, 1);
      assert.equal(fixCalls[0].meetingId, 88);
      assert.equal(fixCalls[0].fromTopId, 99);
      assert.equal(fixCalls[0].toNumber, 3);
    } finally {
      global.window = originalWindow;
      global.alert = originalAlert;
      global.confirm = originalConfirm;
    }
  });
}

module.exports = { runTopsCloseFlowTests };
