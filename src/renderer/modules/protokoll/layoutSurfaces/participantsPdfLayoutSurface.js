export const PARTICIPANTS_PDF_LAYOUT_SURFACE = Object.freeze({
  surfaceKey: "protokoll.participants",
  label: "Teilnehmerliste",
  moduleId: "protokoll",
  medium: "pdf",
  zones: Object.freeze({
    name: Object.freeze({ key: "name", label: "Name", controls: Object.freeze([]) }),
    role: Object.freeze({ key: "role", label: "Funktion", controls: Object.freeze([]) }),
    firm: Object.freeze({ key: "firm", label: "Firma", controls: Object.freeze([]) }),
    contact: Object.freeze({ key: "contact", label: "Kontakt", controls: Object.freeze([]) }),
    marks: Object.freeze({ key: "marks", label: "Anwesend / Verteiler", controls: Object.freeze([]) }),
  }),
});

