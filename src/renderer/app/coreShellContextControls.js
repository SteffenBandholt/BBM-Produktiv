export function registerCoreShellContextControls({ router, btnParticipants, setBtnEnabled } = {}) {
  if (!router || typeof setBtnEnabled !== "function") return null;

  const updateContextButtons = () => {
    const hasProject = !!router.currentProjectId;
    const hasMeeting = !!router.currentMeetingId;

    if (!hasProject) {
      setBtnEnabled(btnParticipants, false, "Bitte zuerst ein Projekt auswählen.");
    } else if (!hasMeeting) {
      setBtnEnabled(btnParticipants, false, "Bitte zuerst eine Besprechung öffnen.");
    } else {
      setBtnEnabled(btnParticipants, true, "");
    }
  };

  window.addEventListener("bbm:router-context", () => {
    updateContextButtons();
  });

  return updateContextButtons;
}
