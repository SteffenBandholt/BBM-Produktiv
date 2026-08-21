import { loadReactRuntime } from "./loadReactRuntime.js";
import { cleanupPopupHandlers, createPopupOverlay } from "../popupCommon.js";

function getPrimaryLabel(mode) {
  if (mode === "output") return "Weiter";
  if (mode === "mail") return "E-Mail senden";
  if (mode === "print") return "PDF-Vorschau";
  return "Protokoll öffnen";
}

function getTitle(mode) {
  if (mode === "output") return "Druckart wählen";
  if (mode === "mail") return "Geschlossenes Protokoll für E-Mail wählen";
  if (mode === "print") return "Geschlossenes Protokoll für Druck wählen";
  return "Geschlossenes Protokoll wählen";
}

function getSubtitle(mode) {
  if (mode === "output") return "Wähle zuerst die gewünschte Ausgabeart.";
  if (mode === "mail") return "Listenbasierte Auswahl geschlossener Protokolle.";
  if (mode === "print") return "Listenbasierte Auswahl geschlossener Protokolle.";
  return "Listenbasierte Auswahl geschlossener Protokolle.";
}

export async function openClosedProtocolSelector({
  mode = "view",
  items = [],
  selectedId = null,
  searchEnabled = mode === "view",
  onConfirm,
} = {}) {
  const { React, ReactDOM } = await loadReactRuntime();

  return await new Promise((resolve) => {
    let closed = false;
    const overlay = createPopupOverlay({ background: "rgba(15, 23, 42, 0.45)", zIndex: 12500 });
    overlay.style.display = "flex";

    const host = document.createElement("div");
    host.style.width = "min(720px, calc(100vw - 28px))";
    host.style.maxHeight = "100%";
    host.style.display = "flex";
    overlay.appendChild(host);
    document.body.appendChild(overlay);

    const root = ReactDOM.createRoot ? ReactDOM.createRoot(host) : null;

    const cleanup = (result = null) => {
      if (closed) return;
      closed = true;
      cleanupPopupHandlers(overlay);
      document.removeEventListener("keydown", escHandler, true);
      if (root) root.unmount();
      else ReactDOM.unmountComponentAtNode(host);
      overlay.remove();
      resolve(result);
    };

    const handleConfirm = async (item) => {
      if (typeof onConfirm === "function") {
        await onConfirm(item);
      }
      cleanup(item || null);
    };

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) cleanup(null);
    });

    const escHandler = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cleanup(null);
    };
    document.addEventListener("keydown", escHandler, true);
    try {
      overlay.focus();
    } catch (_err) {}

    function ClosedProtocolSelector(props) {
      const items = Array.isArray(props.items) ? props.items : [];
      const [query, setQuery] = React.useState("");
      const selectableItems = React.useMemo(
        () => items.filter((item) => !item?.disabled),
        [items]
      );
      const initialSelectedId =
        props.selectedId ||
        selectableItems[0]?.id ||
        items.find((item) => !item?.disabled)?.id ||
        items[0]?.id ||
        null;
      const [currentId, setCurrentId] = React.useState(initialSelectedId);
      const [isSubmitting, setIsSubmitting] = React.useState(false);
      const searchRef = React.useRef(null);

      const filtered = React.useMemo(() => {
        const raw = String(query || "").trim().toLowerCase();
        if (!raw) return items;
        return items.filter((item) => {
          const hay = `${item.label || ""} ${item.searchText || ""}`.toLowerCase();
          return hay.includes(raw);
        });
      }, [items, query]);

      React.useEffect(() => {
        if (props.searchEnabled && searchRef.current) {
          try {
            searchRef.current.focus();
          } catch (_err) {}
        }
      }, [props.searchEnabled]);

      React.useEffect(() => {
        const selectableFiltered = filtered.filter((item) => !item?.disabled);
        if (!selectableFiltered.length) {
          if (currentId !== null) setCurrentId(null);
          return;
        }
        const hasCurrent = selectableFiltered.some((item) => String(item.id) === String(currentId || ""));
        if (!hasCurrent) setCurrentId(selectableFiltered[0]?.id || null);
      }, [filtered, currentId]);

      const activeItem =
        filtered.find((item) => !item?.disabled && String(item.id) === String(currentId || "")) ||
        null;

      const handleMoveSelection = (direction) => {
        const options = filtered.filter((item) => !item?.disabled);
        if (!options.length) return;
        const currentIndex = options.findIndex((item) => String(item.id) === String(currentId || ""));
        const baseIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = Math.min(options.length - 1, Math.max(0, baseIndex + direction));
        setCurrentId(options[nextIndex]?.id || null);
      };

      const submitActiveItem = async (item) => {
        if (!item || item.disabled || isSubmitting) return;
        setIsSubmitting(true);
        try {
          await props.onConfirm(item);
        } finally {
          setIsSubmitting(false);
        }
      };

      const handleListKeyDown = (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          handleMoveSelection(1);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          handleMoveSelection(-1);
          return;
        }
        if (e.key === "Enter" && activeItem) {
          e.preventDefault();
          submitActiveItem(activeItem);
        }
      };

      return React.createElement(
        "div",
        {
          className: "bbm-popup-standard bbm-popup-dialog",
          style: {
            width: "100%",
            maxHeight: "100%",
            boxShadow: "0 18px 44px rgba(15,23,42,0.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        },
        React.createElement(
          "div",
          {
            className: "bbm-popup-header",
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            },
          },
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { fontSize: "16px", fontWeight: "800", color: "var(--bbm-popup-text)" } },
              getTitle(props.mode)
            ),
            React.createElement(
              "div",
              { style: { marginTop: "4px", fontSize: "12px", color: "var(--bbm-popup-muted)" } },
              getSubtitle(props.mode)
            )
          )
        ),
        React.createElement(
          "div",
          {
            className: "bbm-popup-body bbm-form-content",
            style: {
              display: "flex",
              flexDirection: "column",
              flex: "1 1 auto",
              minHeight: "0",
              overflow: "auto",
            },
          },
          props.searchEnabled
            ? React.createElement("input", {
                type: "text",
                ref: searchRef,
                value: query,
                placeholder: "Protokoll suchen",
                onChange: (e) => setQuery(e.target.value || ""),
                onKeyDown: handleListKeyDown,
                style: {
                  width: "100%",
                },
              })
            : null,
          React.createElement(
            "div",
            {
              style: {
                border: "1px solid var(--bbm-popup-border)",
                borderRadius: "var(--bbm-popup-card-radius)",
                overflow: "auto",
                minHeight: "240px",
                maxHeight: "52vh",
                background: "var(--bbm-popup-surface-subtle)",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              },
            },
            filtered.length
              ? filtered.map((item) =>
                  React.createElement(
                    "button",
                    {
                      key: item.id,
                      type: "button",
                      disabled: !!item.disabled,
                      onClick: () => setCurrentId(item.id),
                      onDoubleClick: () => submitActiveItem(item),
                      onKeyDown: handleListKeyDown,
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "4px",
                        width: "100%",
                        textAlign: "left",
                        border:
                          !item.disabled && String(item.id) === String(activeItem?.id || "")
                            ? "1px solid var(--bbm-popup-focus)"
                            : "1px solid var(--bbm-popup-border)",
                        background:
                          item.disabled
                            ? "var(--bbm-popup-disabled-bg)"
                            : String(item.id) === String(activeItem?.id || "")
                              ? "color-mix(in srgb, var(--bbm-popup-focus) 8%, white)"
                              : "var(--bbm-popup-surface)",
                        borderRadius: "var(--bbm-popup-card-radius)",
                        padding: "12px 14px",
                        cursor: item.disabled ? "not-allowed" : "pointer",
                        outline: "none",
                        opacity: item.disabled ? 0.6 : 1,
                      },
                    },
                    React.createElement(
                      "div",
                      { style: { fontSize: "14px", fontWeight: "700", color: "var(--bbm-popup-text)" } },
                      item.label || "Protokoll"
                    ),
                    item.subLabel
                      ? React.createElement(
                          "div",
                          { style: { fontSize: "12px", color: "var(--bbm-popup-muted)" } },
                          item.subLabel
                        )
                      : null
                  )
                )
              : React.createElement(
                  "div",
                  {
                    style: {
                      padding: "18px 12px",
                      textAlign: "center",
                      fontSize: "13px",
                      color: "var(--bbm-popup-muted)",
                    },
                  },
                  query ? "Keine Treffer in den geschlossenen Protokollen." : "Keine geschlossenen Protokolle gefunden."
                )
          )
        ),
        React.createElement(
          "div",
          {
            className: "bbm-popup-footer",
            style: {
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--bbm-popup-footer-gap)",
            },
          },
            React.createElement(
              "button",
              {
                type: "button",
                onClick: () => props.onCancel(),
                style: {
                  border: "1px solid var(--bbm-popup-border-strong)",
                  background: "var(--bbm-popup-surface)",
                  cursor: "pointer",
                },
              },
              "Abbrechen"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                disabled: !activeItem || isSubmitting,
                onClick: () => activeItem && submitActiveItem(activeItem),
                style: {
                  border: "1px solid var(--bbm-popup-primary)",
                  background:
                    activeItem && !isSubmitting
                      ? "var(--bbm-popup-primary)"
                      : "var(--bbm-popup-disabled-bg)",
                  color:
                    activeItem && !isSubmitting
                      ? "#ffffff"
                      : "var(--bbm-popup-disabled-text)",
                  cursor: activeItem && !isSubmitting ? "pointer" : "default",
                },
              },
              isSubmitting ? "Bitte warten..." : getPrimaryLabel(props.mode)
            )
        )
      );
    }

    const element = React.createElement(ClosedProtocolSelector, {
      mode,
      items,
      selectedId,
      searchEnabled,
      onCancel: () => cleanup(null),
      onConfirm: (item) => handleConfirm(item).catch(() => cleanup(null)),
    });

    if (root) root.render(element);
    else ReactDOM.render(element, host);
  });
}
