const assert = require("node:assert/strict");
const { createTopService } = require("../../src/main/domain/TopService");

async function runTopServiceHierarchyTests(run) {
  await run("TopService: Kind-TOPs werden immer als Unterpunkte mit Parent-Level angelegt", () => {
    const tops = new Map([
      ["1", { id: "1", project_id: "p1", level: 1, title: "Titel 1" }],
    ]);
    const created = [];
    const topsRepo = {
      getNextNumber(projectId, parentTopId) {
        assert.equal(projectId, "p1");
        assert.equal(parentTopId, "1");
        return 1;
      },
      getTopById(topId) {
        return tops.get(String(topId)) || null;
      },
      createTop(payload) {
        created.push(payload);
        const top = {
          id: "new-1",
          project_id: payload.projectId,
          parent_top_id: payload.parentTopId ?? null,
          level: payload.level,
          number: payload.number,
          title: payload.title,
        };
        tops.set(top.id, top);
        return top;
      },
    };
    const meetingsRepo = {
      getMeetingById(id) {
        return { id, project_id: "p1", is_closed: 0 };
      },
    };
    const meetingTopsRepo = {
      attachTopToMeeting() {
        return { id: "new-1" };
      },
    };

    const service = createTopService({ topsRepo, meetingsRepo, meetingTopsRepo });
    const createdTop = service.createTop({
      projectId: "p1",
      meetingId: "m1",
      parentTopId: "1",
      level: 1,
      title: "Kind",
    });

    assert.equal(created.length, 1);
    assert.equal(created[0].parentTopId, "1");
    assert.equal(created[0].level, 2);
    assert.equal(created[0].number, 1);
    assert.equal(createdTop.parent_top_id, "1");
    assert.equal(createdTop.level, 2);
  });

  await run("TopService: Root-TOPs bleiben Level 1 und ohne Parent", () => {
    const topsRepo = {
      getNextNumber(projectId, parentTopId) {
        assert.equal(projectId, "p1");
        assert.equal(parentTopId, null);
        return 1;
      },
      getTopById() {
        return null;
      },
      createTop(payload) {
        return {
          id: "root-1",
          project_id: payload.projectId,
          parent_top_id: payload.parentTopId ?? null,
          level: payload.level,
          number: payload.number,
          title: payload.title,
        };
      },
    };
    const meetingsRepo = {
      getMeetingById(id) {
        return { id, project_id: "p1", is_closed: 0 };
      },
    };
    const meetingTopsRepo = {
      attachTopToMeeting() {
        return { id: "root-1" };
      },
    };

    const service = createTopService({ topsRepo, meetingsRepo, meetingTopsRepo });
    const createdTop = service.createTop({
      projectId: "p1",
      meetingId: "m1",
      parentTopId: null,
      level: 1,
      title: "Titel 1",
    });

    assert.equal(createdTop.parent_top_id, null);
    assert.equal(createdTop.level, 1);
  });
}

module.exports = { runTopServiceHierarchyTests };
