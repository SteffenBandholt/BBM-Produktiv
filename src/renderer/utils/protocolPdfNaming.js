import { normalizeSeriesKey, resolveSeriesTitle } from "../../shared/meetingSeries.mjs";

function cleanPart(value) {
  return String(value || "")
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateDot(value) {
  const raw = String(value || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split("-");
    return `${d}.${m}.${y}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function buildProtocolPdfFileName({
  projectNumber = "",
  projectShortName = "",
  protocolTitle = "",
  meetingIndex = "",
  meetingDate = "",
  seriesKey,
  meetingId = "",
} = {}) {
  const projectNumberClean = cleanPart(projectNumber);
  const projectShortClean = cleanPart(projectShortName);
  const protocolTitleClean = cleanPart(resolveSeriesTitle(seriesKey, protocolTitle));
  const meetingIndexClean = cleanPart(meetingIndex);
  const meetingDateDot = formatDateDot(meetingDate);

  if (!projectNumberClean || !protocolTitleClean || !meetingIndexClean || !meetingDateDot) {
    return "";
  }

  const readable = projectShortClean
    ? `${projectNumberClean}_${projectShortClean}_${protocolTitleClean}_#${meetingIndexClean} - ${meetingDateDot}.pdf`
    : `${projectNumberClean}_${protocolTitleClean}_#${meetingIndexClean} - ${meetingDateDot}.pdf`;
  return withMeetingPdfIdentity(readable, { seriesKey, meetingId });
}

export function withMeetingPdfIdentity(fileName, { seriesKey, meetingId } = {}) {
  const key = normalizeSeriesKey(seriesKey);
  const id = String(meetingId || "").trim();
  if (!id) return fileName;
  // Encode uppercase ASCII and delimiters explicitly: imported IDs remain
  // distinct on case-insensitive Windows filesystems as well.
  const encodedId = Array.from(id, (char) => /[A-Z_!'()*]/.test(char)
    ? `%${char.charCodeAt(0).toString(16).toUpperCase()}` : encodeURIComponent(char)).join("");
  const prefix = `${key}--${encodedId}__`;
  return String(fileName || "").startsWith(prefix) ? String(fileName) : prefix + String(fileName || "BBM.pdf");
}

export function buildProtocolPdfFileInfo({
  baseDir = "",
  project = null,
  settings = null,
  meeting = null,
} = {}) {
  const projectNumber = cleanPart(
    project?.project_number ?? project?.projectNumber ?? project?.number ?? ""
  );
  const projectShortName = cleanPart(project?.short ?? project?.short_name ?? project?.name ?? "");
  const projectName = cleanPart(project?.name ?? project?.project_name ?? projectShortName);
  const protocolTitle = cleanPart(settings?.["pdf.protocolTitle"] || "Protokoll");
  const meetingIndex = cleanPart(
    meeting?.meeting_index ?? meeting?.meetingIndex ?? meeting?.index ?? meeting?.number ?? ""
  );
  const meetingDate =
    meeting?.meeting_date ??
    meeting?.meetingDate ??
    meeting?.date ??
    meeting?.created_at ??
    meeting?.createdAt ??
    "";

  const fileName = buildProtocolPdfFileName({
    projectNumber,
    projectShortName,
    protocolTitle,
    meetingIndex,
    meetingDate,
    seriesKey: meeting?.series_key,
    meetingId: meeting?.id,
  });
  if (!fileName) return null;

  const projectFolderName = projectNumber && projectName
    ? `${projectNumber} - ${projectName}`
    : (projectName || projectNumber);

  const normalizedBase = String(baseDir || "").replace(/[\\/]+$/g, "");
  const filePath = normalizedBase
    ? `${normalizedBase}/bbm/${projectFolderName}/Protokolle/${fileName}`
    : "";

  return {
    fileName,
    filePath,
    projectNumber,
    projectShortName,
    protocolTitle,
    meetingIndex,
  };
}
