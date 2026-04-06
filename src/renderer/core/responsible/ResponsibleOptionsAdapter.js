import { toCompanyOptions } from "../../stamm/firmen/index.js";
import { filterEmployeesByCompany, toEmployeeOptions } from "../../stamm/mitarbeiter/index.js";

function asText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function withPrefix(options, prefix) {
  const normalizedPrefix = asText(prefix);
  if (!normalizedPrefix) return options;
  return options.map((option) => ({
    ...option,
    value: `${normalizedPrefix}:${option.value}`,
  }));
}

export function buildCompanyAssigneeOptions(companies, config = {}) {
  const options = toCompanyOptions(companies);
  return withPrefix(options, config.valuePrefix);
}

export function buildEmployeeAssigneeOptions(employees, config = {}) {
  const filtered =
    config.companyId == null || asText(config.companyId) === ""
      ? employees
      : filterEmployeesByCompany(employees, config.companyId);

  const options = toEmployeeOptions(filtered);
  return withPrefix(options, config.valuePrefix);
}

export function buildAssigneeOptions(input = {}, config = {}) {
  const companyOptions = buildCompanyAssigneeOptions(input.companies || [], {
    valuePrefix: config.companyValuePrefix ?? "company",
  });

  const employeeOptions = buildEmployeeAssigneeOptions(input.employees || [], {
    companyId: config.companyId,
    valuePrefix: config.employeeValuePrefix ?? "employee",
  });

  return [...companyOptions, ...employeeOptions];
}

