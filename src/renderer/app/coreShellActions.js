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

export function createQuitActionButton() {
  const btnQuit = document.createElement("button");
  btnQuit.textContent = "Beenden";
  btnQuit.dataset.variant = "danger";
  btnQuit.style.width = "100%";
  btnQuit.style.padding = "10px 10px";
  btnQuit.style.borderRadius = "8px";
  btnQuit.style.cursor = "pointer";
  btnQuit.style.border = "1px solid #b71c1c";
  btnQuit.style.background = "#c62828";
  btnQuit.style.color = "white";
  btnQuit.style.fontWeight = "700";

  btnQuit.onclick = async () => {
    try {
      if (window.bbmDb && typeof window.bbmDb.appQuit === "function") {
        if (typeof window.bbmDb.topsPurgeTrashedGlobal === "function") {
          try {
            const purgeRes = await Promise.race([
              window.bbmDb.topsPurgeTrashedGlobal(),
              new Promise((resolve) => setTimeout(() => resolve({ ok: false, timeout: true }), 1000)),
            ]);
            if (purgeRes?.timeout) {
              console.warn("[app] topsPurgeTrashedGlobal timeout before quit");
            } else if (purgeRes?.ok === false) {
              console.warn("[app] topsPurgeTrashedGlobal failed before quit:", purgeRes.error);
            }
          } catch (err) {
            console.warn("[app] topsPurgeTrashedGlobal error before quit:", err);
          }
        }

        await window.bbmDb.appQuit();
        return;
      }

      if (typeof window.close === "function") {
        window.close();
        return;
      }

      alert("Beenden ist in dieser Umgebung nicht verfügbar.");
    } catch (e) {
      alert(e?.message || "Beenden fehlgeschlagen");
    }
  };

  return btnQuit;
}
