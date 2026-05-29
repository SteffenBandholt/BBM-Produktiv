const INITIAL_RESTARBEITEN_V2_DUMMY_ITEMS = [
  {
    id: "R-001",
    title: "Offene Restarbeit",
    location: "Treppenhaus",
    status: "offen",
    shortText: "Offene Restarbeit",
    longText: "Offene Restarbeit im Treppenhaus",
    meta: "R-001 / offen",
    photos: "Keine Fotos",
    note: "Platzhalternotiz",
  },
  {
    id: "R-002",
    title: "Musterpunkt",
    location: "Wohnung",
    status: "erledigt",
    shortText: "Musterpunkt",
    longText: "Musterpunkt in der Wohnung",
    meta: "R-002 / erledigt",
    photos: "Keine Fotos",
    note: "Platzhalternotiz",
  },
  {
    id: "R-003",
    title: "Kontrollpunkt",
    location: "Außenanlage",
    status: "offen",
    shortText: "Kontrollpunkt",
    longText: "Kontrollpunkt in der Außenanlage",
    meta: "R-003 / offen",
    photos: "Keine Fotos",
    note: "Platzhalternotiz",
  },
];

function cloneItem(item) {
  return {
    id: item.id,
    title: item.title,
    location: item.location,
    status: item.status,
    shortText: item.shortText,
    longText: item.longText,
    meta: item.meta,
    photos: item.photos,
    note: item.note,
  };
}

function getNextDummyNumber(existingItems) {
  let maxNumber = 0;
  for (const item of Array.isArray(existingItems) ? existingItems : []) {
    const match = String(item?.id || "").match(/^R-(\d+)$/);
    if (!match) continue;
    maxNumber = Math.max(maxNumber, Number(match[1] || 0));
  }
  return maxNumber + 1;
}

function createDummyItem(id) {
  return {
    id,
    title: "Neue Restarbeit",
    location: "Noch ohne Verortung",
    status: "offen",
    shortText: "Neue Restarbeit",
    longText: "Lokaler DEV-Entwurf ohne Speicherung",
    meta: "DEV",
    photos: "Keine Fotos",
    note: "Nur lokale Vorschau",
  };
}

export function createInitialRestarbeitenV2DummyItems() {
  return INITIAL_RESTARBEITEN_V2_DUMMY_ITEMS.map(cloneItem);
}

export function createNextRestarbeitenV2DummyItem(existingItems) {
  const nextNumber = getNextDummyNumber(existingItems);
  const nextId = `R-${String(nextNumber).padStart(3, "0")}`;
  return createDummyItem(nextId);
}
