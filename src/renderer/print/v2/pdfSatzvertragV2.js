export const PDF_SATZVERTRAG_V2_VERSION = "m85.0-v1";

export const PDF_SATZVERTRAG_IDS = Object.freeze({
  pageFormat: "PDF-V2-SATZ-001",
  firstPageHeader: "PDF-V2-SATZ-002",
  followingPageHeader: "PDF-V2-SATZ-003",
  pageCounter: "PDF-V2-SATZ-004",
  footerReserve: "PDF-V2-SATZ-005",
  repeatedTableHeader: "PDF-V2-SATZ-006",
  recordFit: "PDF-V2-SATZ-007",
  protocolSplit: "PDF-V2-SATZ-008",
  protocolSplitMinimum: "PDF-V2-SATZ-009",
  levelOneKeepWithContent: "PDF-V2-SATZ-010",
  participants: "PDF-V2-PROT-001",
  preRemarks: "PDF-V2-PROT-002",
  closing: "PDF-V2-PROT-003",
  protocolFooter: "PDF-V2-PROT-004",
  emptyTops: "PDF-V2-PROT-005",
  restarbeitenOrder: "PDF-V2-REST-001",
  restarbeitenRecord: "PDF-V2-REST-002",
  restarbeitenMeasurement: "PDF-V2-REST-003",
  editorPaginationBoundary: "PDF-V2-EDIT-001",
  pageBreakLocked: "PDF-V2-EDIT-002",
  domainOperationsLocked: "PDF-V2-EDIT-003",
  singleRenderer: "PDF-V2-ARCH-001",
  singlePagination: "PDF-V2-ARCH-002",
  singleProfileStore: "PDF-V2-ARCH-003",
  historicalPathsInactive: "PDF-V2-ARCH-004",
});

function round(value, precision = 3) {
  const factor = 10 ** precision;
  return Math.round(Number(value || 0) * factor) / factor;
}

function pxToMm(value, pageRect, orientation, axis) {
  const pageMm = axis === "x"
    ? (orientation === "landscape" ? 297 : 210)
    : (orientation === "landscape" ? 210 : 297);
  const pagePx = axis === "x" ? Number(pageRect?.width || 0) : Number(pageRect?.height || 0);
  return pagePx > 0 ? round(Number(value || 0) * pageMm / pagePx) : 0;
}

function pageMetrics(pageElement, orientation) {
  const pageRect = pageElement?.getBoundingClientRect?.() || {};
  const body = pageElement?.querySelector?.(".v2PageBody") || null;
  const reserve = pageElement?.querySelector?.(".v2FooterReserveSpacer") || null;
  const bodyRect = body?.getBoundingClientRect?.() || {};
  const reserveRect = reserve?.getBoundingClientRect?.() || {};
  const content = Array.from(body?.children || []).filter((node) => {
    const style = globalThis.getComputedStyle?.(node);
    return style?.display !== "none";
  });
  const usedBottom = content.reduce((max, node) => {
    const rect = node.getBoundingClientRect?.() || {};
    return Math.max(max, Number(rect.bottom || 0));
  }, Number(bodyRect.top || 0));
  const availablePx = Math.max(0, Number(reserveRect.top || pageRect.bottom || 0) - Number(bodyRect.top || 0));
  const usedPx = Math.max(0, usedBottom - Number(bodyRect.top || 0));
  return {
    availableHeightMm: pxToMm(availablePx, pageRect, orientation, "y"),
    usedHeightMm: pxToMm(usedPx, pageRect, orientation, "y"),
    remainingHeightMm: pxToMm(availablePx - usedPx, pageRect, orientation, "y"),
  };
}

function recordKey(row, index) {
  if (row?.kind === "top") return `top:${String(row.numText || index + 1)}`;
  if (row?.kind === "restarbeitItem") return `restarbeit:${String(row?.sourceId || row?.cells?.[0] || index + 1)}`;
  if (String(row?.kind || "").startsWith("invoice")) return `invoice:${String(row?.sourceId || index + 1)}`;
  if (row?.kind) return `${row.kind}:${index + 1}`;
  return `row:${index + 1}`;
}

function collectRecordOccurrences(pages) {
  const totals = new Map();
  for (const page of pages || []) {
    (page?.table?.rows || []).forEach((row, index) => {
      const key = recordKey(row, index);
      totals.set(key, (totals.get(key) || 0) + 1);
    });
  }
  return totals;
}

function collectAppliedDesign(root, data = {}) {
  const firstTops = root?.querySelector?.(".topsTable") || null;
  const firstRestarbeiten = root?.querySelector?.(".restarbeitenTable") || null;
  const font = (selector) => {
    const node = root?.querySelector?.(selector);
    const size = node ? parseFloat(globalThis.getComputedStyle?.(node)?.fontSize || "") : NaN;
    return Number.isFinite(size) ? round(size) : null;
  };
  const width = (rootNode, selector) => {
    const node = rootNode?.querySelector?.(selector);
    const tableRect = rootNode?.getBoundingClientRect?.() || {};
    const rect = node?.getBoundingClientRect?.() || {};
    return Number(tableRect.width) > 0 && Number(rect.width) > 0
      ? round(Number(rect.width) * 100 / Number(tableRect.width))
      : null;
  };
  const restarbeitenColumns = firstRestarbeiten
    ? Array.from(firstRestarbeiten.querySelectorAll?.("colgroup col") || []).map((column) => ({
        key: String(column?.dataset?.restarbeitenColumn || ""),
        widthMm: Number.parseFloat(String(column?.style?.width || "")) || 0,
        minWidthMm: Number(column?.dataset?.minWidthMm || 0),
        maxWidthMm: Number(column?.dataset?.maxWidthMm || 0),
      }))
    : [];
  return {
    globalHeaderHeightMm: Number(data?.v2Layout?.globalHeaderHeightMm) || null,
    globalLogoBoxHeightMm: Number(data?.v2Layout?.globalLogoBoxHeightMm) || 0,
    pagePadTopMm: Number(data?.v2Layout?.pagePadTopMm) || null,
    globalHeaderLogoCount: root?.querySelectorAll?.(".v2GlobalHeader .v2LogoBox")?.length || 0,
    logoPlaceholderTextPresent: String(root?.textContent || "").includes("Logo optional - Einstellungen > Drucken > Logos"),
    topsColumnWidthsPercent: firstTops ? {
      number: width(firstTops, "thead .colNr"),
      text: width(firstTops, "thead .colText"),
      meta: width(firstTops, "thead .colMeta"),
    } : null,
    restarbeitenColumnCount: firstRestarbeiten?.querySelectorAll?.("thead th")?.length || 0,
    ...(firstRestarbeiten ? {
      restarbeitenColumns,
      restarbeitenTableWidthMm: round(restarbeitenColumns.reduce((sum, column) => sum + column.widthMm, 0)),
    } : {}),
    fontSizesPx: {
      topHeading: font(".topsTable thead"),
      topShortText: font(".topsTable .shortText"),
      topLongText: font(".topsTable .longText"),
      preRemarks: font(".v2PreRemarksText"),
    },
  };
}

export function buildPdfSatzvertragSnapshot({ fixtureId, pages, data, root } = {}) {
  const normalizedPages = Array.isArray(pages) ? pages : [];
  const pageElements = Array.from(root?.querySelectorAll?.(".page") || []);
  const orientation = String(data?.orientation || "portrait").toLowerCase() === "landscape"
    ? "landscape"
    : "portrait";
  const occurrenceTotals = collectRecordOccurrences(normalizedPages);
  const seen = new Map();
  const isRestarbeiten = String(data?.mode || "").trim().toLowerCase() === "restarbeiten";
  const isInvoice = String(data?.mode || "").trim().toLowerCase() === "invoice";
  const restarbeitenSourceOrder = isRestarbeiten
    ? (data?.restarbeitenItems || [])
        .filter((row) => !String(row?.deleted_at || "").trim())
        .map((row) => String(row?.id || row?.running_number || ""))
    : [];

  return {
    contractVersion: PDF_SATZVERTRAG_V2_VERSION,
    fixtureId: String(fixtureId || ""),
    mode: String(data?.mode || ""),
    orientation,
    pageCount: normalizedPages.length,
    ...(isRestarbeiten ? {
      restarbeitenSourceOrder,
      restarbeitenEmpty: restarbeitenSourceOrder.length === 0,
    } : {}),
    ...(isInvoice ? {
      invoice: {
        preview: data?.invoice?.preview === true,
        fullHeaderWithinV2Shell: Boolean(root?.querySelector?.(".v2HeaderFull > .v2FullSlotContent > .invoicePdfFullHeaderContent")),
        protocolGuidePresent: Boolean(root?.querySelector?.(".v2HeaderFull .v2FullLeftWrap")),
        editorParents: Object.fromEntries(Array.from(root?.querySelectorAll?.("[data-ui-inspector-id^='pdf.bbm.invoice']") || [])
          .map((node) => [String(node.dataset.uiInspectorId || ""), String(node.dataset.uiEditorParent || "")])
          .filter(([id]) => id)
          .sort(([left], [right]) => left.localeCompare(right))),
      },
    } : {}),
    pages: normalizedPages.map((page, pageIndex) => {
      const element = pageElements[pageIndex] || null;
      const rows = page?.table?.rows || [];
      const pageRect = element?.getBoundingClientRect?.() || {};
      const pageCounter = element?.querySelector?.(".v2FullPageCounter,.v2MiniRight") || null;
      const pageCounterRect = pageCounter?.getBoundingClientRect?.() || {};
      const pageBody = element?.querySelector?.(".v2PageBody") || null;
      const pageBodyRect = pageBody?.getBoundingClientRect?.() || {};
      const restarbeitenTable = element?.querySelector?.(".restarbeitenTable") || null;
      const restarbeitenTableRect = restarbeitenTable?.getBoundingClientRect?.() || {};
      const pageCounterWithinPage = Number(pageCounterRect.width) > 0
        && Number(pageCounterRect.height) > 0
        && Number(pageCounterRect.left) >= Number(pageRect.left)
        && Number(pageCounterRect.right) <= Number(pageRect.right)
        && Number(pageCounterRect.top) >= Number(pageRect.top)
        && Number(pageCounterRect.bottom) <= Number(pageRect.bottom);
      const records = rows.map((row, rowIndex) => {
        const id = recordKey(row, rowIndex);
        const occurrence = (seen.get(id) || 0) + 1;
        seen.set(id, occurrence);
        const total = occurrenceTotals.get(id) || 1;
        return {
          id,
          segment: row?.kind === "restarbeitItem" && row?.segment
            ? String(row.segment)
            : total === 1 ? "complete" : occurrence === 1 ? "start" : "continuation",
          level: row?.kind === "top" ? Number(row.level || 0) : null,
        };
      });
      const blocks = [];
      if (pageIndex === 0) blocks.push("globalHeader", "fullHeader");
      else blocks.push("miniHeader");
      if (page?.intro) blocks.push("participants");
      if (page?.preRemarks) blocks.push("preRemarks");
      const isTops = String(page?.table?.type || "") === "tops";
      if (isInvoice && page?.invoiceFirst && element?.querySelector?.(".invoicePdfIntro")) blocks.push("invoiceIntro");
      if ((!isTops || rows.length) && !(isInvoice && page?.suppressTable)) blocks.push("table");
      if (page?.topsTail) blocks.push("closing");
      if (isInvoice && page?.invoiceLast) blocks.push("invoiceTail");
      blocks.push("footerReserve");
      return {
        pageNumber: pageIndex + 1,
        pageType: pageIndex === 0 ? "first" : "following",
        headerKind: pageIndex === 0 ? "full" : "mini",
        globalHeaderPresent: Boolean(element?.querySelector?.(".v2GlobalHeaderBlock")),
        fullHeaderPresent: Boolean(element?.querySelector?.(".v2HeaderFull")),
        miniHeaderPresent: Boolean(element?.querySelector?.(".v2HeaderMini")),
        visiblePageCounterText: String(element?.querySelector?.(".v2FullPageCounter,.v2MiniRight")?.textContent || "")
          .replace(/\s+/g, " ")
          .trim() || null,
        ...(isTops ? { pageCounterWithinPage } : {}),
        ...(isRestarbeiten ? {
          pageCounterWithinPage,
          tableWidthMm: pxToMm(Number(restarbeitenTableRect.width || 0), pageRect, orientation, "x"),
          tableAvailableWidthMm: pxToMm(Number(pageBodyRect.width || 0), pageRect, orientation, "x"),
          tableWithinPage: Number(restarbeitenTableRect.width || 0) > 0
            && Number(restarbeitenTableRect.left || 0) >= Number(pageBodyRect.left || 0) - 0.5
            && Number(restarbeitenTableRect.right || 0) <= Number(pageBodyRect.right || 0) + 0.5,
          columnCount: restarbeitenTable?.querySelectorAll?.("thead th")?.length || 0,
          columnKeys: Array.from(restarbeitenTable?.querySelectorAll?.("colgroup col") || [])
            .map((column) => String(column?.dataset?.restarbeitenColumn || "")),
          emptyStatePresent: Boolean(restarbeitenTable?.querySelector?.("tbody td[colspan='13']")),
          continuationCount: rows.filter((row) => ["continuation", "end"].includes(String(row?.segment || ""))).length,
        } : {}),
        ...(isInvoice ? {
          invoiceFullHeaderText: String(element?.querySelector?.(".invoicePdfFullHeaderContent")?.textContent || "").replace(/\s+/g, " ").trim() || null,
          invoiceMiniPrimaryText: String(element?.querySelector?.(".v2MiniProject")?.textContent || "").replace(/\s+/g, " ").trim() || null,
          invoiceMiniSecondaryText: String(element?.querySelector?.(".v2MiniProtocolTitle")?.childNodes?.[0]?.textContent || "").replace(/\s+/g, " ").trim() || null,
          invoiceDraftNoticeText: String(element?.querySelector?.(".v2FullDraftBadge,.v2MiniDraftNotice")?.textContent || "").replace(/\s+/g, " ").trim() || null,
          invoiceIntroPresent: Boolean(element?.querySelector?.(".invoicePdfIntro")),
          invoiceNepPresent: Array.from(element?.querySelectorAll?.(".invoicePdfCol--total-price") || []).some((node) => String(node.textContent || "").trim() === "NEP"),
          invoiceNotePresent: Boolean(element?.querySelector?.(".invoicePdfNoteRow .invoicePdfSpecialLabel")),
          invoiceTotalsPresent: Boolean(element?.querySelector?.(".invoicePdfTotals")),
        } : {}),
        tableType: String(page?.table?.type || ""),
        tableHeaderPresent: Boolean(element?.querySelector?.("table thead")),
        participantsPresent: Boolean(page?.intro),
        participantRowCount: Array.isArray(page?.intro?.rows) ? page.intro.rows.length : 0,
        ...(isTops ? {
          participantRows: Array.isArray(page?.intro?.rows)
            ? page.intro.rows.map((row, rowIndex) => ({
                id: `participant:${Number(row?.sourceIndex ?? rowIndex) + 1}`,
                segment: String(row?.participantSegment || "complete"),
              }))
            : [],
        } : {}),
        preRemarksPresent: Boolean(page?.preRemarks),
        ...(isTops ? {
          preRemarksSegment: page?.preRemarks ? String(page.preRemarks.segment || "complete") : null,
          preRemarksTextLength: page?.preRemarks ? String(page.preRemarks.text || "").length : 0,
          preRemarksWordCount: page?.preRemarks
            ? String(page.preRemarks.text || "").trim().split(/\s+/).filter(Boolean).length
            : 0,
        } : {}),
        closingPresent: Boolean(page?.topsTail),
        protocolFooterPresent: Boolean(element?.querySelector?.(".v2ProtocolFooter")),
        footerReservePresent: Boolean(element?.querySelector?.(".v2FooterReserveSpacer")),
        blockOrder: blocks,
        records,
        ...pageMetrics(element, orientation),
      };
    }),
    appliedDesign: collectAppliedDesign(root, data),
  };
}
