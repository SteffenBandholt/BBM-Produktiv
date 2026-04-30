export function createParticipantsActionButton({ router, mkActionBtn, runNavSafe } = {}) {
  if (typeof mkActionBtn !== "function") return null;

  return mkActionBtn(runNavSafe, "Teilnehmer", async () => {
    if (!router?.currentProjectId) {
      alert("Bitte zuerst ein Projekt auswählen.");
      return;
    }
    if (!router?.currentMeetingId) {
      alert("Bitte zuerst eine Besprechung öffnen.");
      return;
    }

    if (typeof router?.openParticipantsModal === "function") {
      await router.openParticipantsModal({
        projectId: router.currentProjectId,
        meetingId: router.currentMeetingId,
      });
      return;
    }

    if (typeof router?.openParticipants === "function") {
      await router.openParticipants({
        projectId: router.currentProjectId,
        meetingId: router.currentMeetingId,
      });
    }
  });
}
