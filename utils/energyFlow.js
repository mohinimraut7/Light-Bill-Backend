// =====================================================================
// 23-Oct-2026: Energy Expenditure — नवीन approval flow (सर्व Head Office)
//
//   Clerk (Electrical) -> Junior Engineer -> Sectional Engineer -> Deputy Engineer
//   -> Executive Engineer -> Clerk (Accounts) -> Accountant -> Deputy CAFO -> CAFO
//   -> Auditor -> Deputy Chief Auditor -> Chief Auditor -> Additional Commissioner
//   -> RTGS Account Officer
//
// ↕ : Approve केल्यावर report पुढच्या step कडे जातो; Reject केल्यावर मागच्या step कडे परत.
// key = signature slot / stepStatus मधील code (बदलू नका, frontend मध्येही तेच)
// =====================================================================
const ENERGY_FLOW = [
  { key: "CLERK_E", role: "Clerk", department: "Electrical", label: "Clerk (Electrical)" },
  { key: "JE", role: "Junior Engineer", label: "Junior Engineer" },
  { key: "SE", role: "Sectional Engineer", label: "Sectional Engineer" },
  { key: "DE", role: "Deputy Engineer", label: "Deputy Engineer" },
  { key: "EE", role: "Executive Engineer", label: "Executive Engineer" },
  { key: "CLERK_A", role: "Clerk", department: "Accounts", label: "Clerk (Accounts)" },
  { key: "ACCOUNTANT", role: "Accountant", label: "Accountant" },
  { key: "DY_CAFO", role: "Deputy CAFO", label: "Deputy CAFO" },
  { key: "CAFO", role: "CAFO", label: "CAFO" },
  { key: "AUDITOR", role: "Auditor", label: "Auditor" },
  { key: "DY_CHIEF_AUDITOR", role: "Deputy Chief Auditor", label: "Deputy Chief Auditor" },
  { key: "CHIEF_AUDITOR", role: "Chief Auditor", label: "Chief Auditor" },
  { key: "ADDL_COMMISSIONER", role: "Additional Commissioner", label: "Additional Commissioner" },
  { key: "RTGS", role: "RTGS Account Officer", label: "RTGS Account Officer" },
];

const FLOW_WARD = "Head Office";

// सही + approval लागणारे forms (Faulty Meter workflow मध्ये आहे पण सही लागत नाही)
const REQUIRED_FORM_TYPES = ["wardbilllist", "form22", "karyalayintipani"];

/** user चा role (+ Clerk साठी department) -> flow मधील index, नसेल तर -1 */
const getStepIndex = (role, department) =>
  ENERGY_FLOW.findIndex((s) => s.role === role && (!s.department || s.department === department));

module.exports = { ENERGY_FLOW, FLOW_WARD, REQUIRED_FORM_TYPES, getStepIndex };