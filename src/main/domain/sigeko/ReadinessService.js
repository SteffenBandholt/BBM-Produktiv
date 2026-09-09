"use strict";

const { createSigekoProjectService } = require("./SigekoProjectService");
const { createProjectAuthorityService } = require("./ProjectAuthorityService");
const projectsRepo = require("../../db/projectsRepo");

const PROJECT_FIELDS = [
  ["name", "Projektname"], ["street", "Straße und Hausnummer"], ["zip", "Postleitzahl"], ["city", "Ort"],
  ["geplanter_baubeginn", "Geplanter Baubeginn"], ["end_date", "Bauende"],
];
const CONTACT_FIELDS = [["name", "Name"], ["street", "Straße und Hausnummer"], ["zip", "Postleitzahl"], ["city", "Ort"]];
const AUTHORITY_LABELS = { LABOR_AUTHORITY: "Arbeitsschutzbehörde", HOSPITAL: "Krankenhaus / ZNA", ACCIDENT_DOCTOR: "D-Arzt",
  WATER: "Wasser", ELECTRICITY: "Stromnetz", GAS: "Gasnetz", EMERGENCY_112: "Notruf 112", POLICE: "Polizei" };

function missingFields(issues, values, fields, prefix, label, action) {
  for (const [field, title] of fields) {
    if (typeof values?.[field] !== "string" || !values[field].trim()) {
      issues.push({ code: "FIELD_MISSING", field: `${prefix}.${field}`, message: `${label}: ${title} fehlt.`, action });
    }
  }
}

// Completeness is calculated from current saved sources. It is neither persisted
// nor used as authorization; technical read errors must reach the caller.
function createReadinessService({ projectService = createSigekoProjectService(), projects = projectsRepo,
  projectAuthorityService = createProjectAuthorityService({ projects }) } = {}) {
  return Object.freeze({
    getReadiness(payload) {
      const data = projectService.getProjectData(payload);
      const projectId = data.project.id;
      const builder = projects.getBuilder(projectId);
      const issues = [];
      missingFields(issues, data.project, PROJECT_FIELDS, "project", "Projekt", "project");
      if (!builder.ref) {
        issues.push({ code: "BUILDER_NOT_ASSIGNED", field: "builder", message: "Bauherr: In der Projektverwaltung noch nicht zugeordnet.", action: "project" });
      } else if (builder.sourceMissing || !builder.firm) {
        issues.push({ code: "BUILDER_SOURCE_MISSING", field: "builder", message: "Bauherr: Die zugeordnete Firma ist nicht mehr verfügbar.", action: "project" });
      } else {
        missingFields(issues, builder.firm, CONTACT_FIELDS, "builder", "Bauherr", "project");
      }
      for (const [role, label] of [["planning", "SiGeKo Planung"], ["execution", "SiGeKo Ausführung"]]) {
        const resolved = data[role];
        if (!resolved) {
          issues.push({ code: "ROLE_NOT_ASSIGNED", field: role, message: `${label}: Noch nicht zugeordnet.`, action: "roles" });
          continue;
        }
        const isProfile = resolved.assignment.source === "module";
        const action = isProfile ? "profile" : "roles";
        if (resolved.sourceMissing || !resolved.values) {
          issues.push({ code: isProfile ? "PROFILE_MISSING" : "ROLE_SOURCE_MISSING", field: role,
            message: `${label}: ${isProfile ? "Das eigene SiGeKo-Profil fehlt." : "Die zugeordnete Person ist nicht mehr verfügbar."}`, action });
        } else {
          missingFields(issues, resolved.values, CONTACT_FIELDS, role, label, action);
        }
      }
      const authorityData = projectAuthorityService.getProjectAuthorities({ projectId });
      return { projectId, projectData: { status: issues.length ? "red" : "green", issues },
        authorities: { status: authorityData.status, available: true,
          categories: authorityData.categories.map(({ category, status }) => ({ category, status })),
          issues: authorityData.categories.flatMap(entry => entry.issues.map(issue => ({ ...issue, category: entry.category,
            message: `${AUTHORITY_LABELS[entry.category]}: ${issue.message}`, action: "authorities" }))) } };
    },
  });
}

module.exports = Object.freeze({ createReadinessService });
