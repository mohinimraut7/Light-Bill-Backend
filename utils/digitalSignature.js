// =====================================================================
// utils/digitalSignature.js
// Report PDF वर officer चा Digital Signature (DSC) लावणे.
//
// नियम (महत्त्वाचे):
//   * पहिला DSC लागल्यानंतर PDF कधीही pdf-lib ने पुन्हा save / removePage करायची नाही.
//     तसे केल्यास आधीचे सर्व signatures INVALID होतात.
//   * प्रत्येक approval = एक "incremental" signature (आधीचे signatures valid राहतात).
//   * सही कुठे लावायची ते doc.signatureSlots मध्ये असते
//       - Ward Bills / Form 22 : frontend PDF बनवतानाच slots पाठवतो (dynamic)
//       - कार्यालयीन टिपणी   : frontend slots पाठवतो, नसेल तर खालचे FIXED_SLOTS
//
// Signing प्रत्यक्ष "sign-service" (pyHanko) करते. आत्ता dummy .pfx ने,
// नंतर USB token (Class-3 DSC) आल्यावर फक्त हा module बदलायचा.
// =====================================================================
const path = require("path");
const axios = require("axios");

const SIGN_SERVICE_URL = process.env.SIGN_SERVICE_URL || "http://127.0.0.1:7001";
const SIGN_SERVICE_KEY = process.env.SIGN_SERVICE_KEY || "";
const DSC_ENABLED = process.env.DSC_ENABLED !== "false";

// role + ward -> signature slot key
const getRoleKey = (role, userWard) => {
  if (role === "Lipik") return "LIPIK";
  if (role === "Junior Engineer") return userWard === "Head Office" ? "JE_HO" : "JE_WARD";
  if (role === "Accountant") return "ACCOUNTANT";
  if (role === "Assistant Municipal Commissioner") return "AMC";
  if (role === "Dy.Municipal Commissioner") return "DMC";
  return null;
};

const DESIGNATION = {
  LIPIK: "Lipik, Electrical Dept",
  JE_WARD: "Junior Engineer (Ward)",
  JE_HO: "Junior Engineer (Head Office)",
  ACCOUNTANT: "Accountant",
  AMC: "Asst. Municipal Commissioner",
  DMC: "Dy. Municipal Commissioner",
};

// Frontend ने slots पाठवले नाहीत तर fallback (PDF points, A4 portrait 595x842, origin खाली-डावीकडे).
// कार्यालयीन टिपणी मधील सध्याच्या jsPDF positions (mm) वरून काढलेले.
// ⚠ Form 22 वर कोणत्या role ची सही कोणत्या जागी - office कडून confirm करा.
const FIXED_SLOTS = {
  karyalayintipani: {
    LIPIK:      { page: 0, box: [103.5, 436.5, 250.9, 484.7] },
    JE_WARD:    { page: 0, box: [273.5, 436.5, 420.9, 484.7] },
    JE_HO:      { page: 0, box: [429.4, 436.5, 576.9, 484.7] },
    ACCOUNTANT: { page: 0, box: [103.5, 82.2, 233.9, 130.4] },
    AMC:        { page: 0, box: [306.1, 82.2, 436.5, 130.4] },
    DMC:        { page: 0, box: [453.5, 82.2, 583.9, 130.4] },
  },
};

const parseSlots = (raw) => {
  if (!raw) return null;
  try {
    const slots = typeof raw === "string" ? JSON.parse(raw) : raw;
    for (const [k, v] of Object.entries(slots)) {
      if (!Number.isInteger(v.page) || !Array.isArray(v.box) || v.box.length !== 4) {
        throw new Error(`bad slot ${k}`);
      }
    }
    return slots;
  } catch (e) {
    console.warn("Invalid signatureSlots, ignoring:", e.message);
    return null;
  }
};

const getSlot = (doc, roleKey) =>
  (doc.signatureSlots && doc.signatureSlots[roleKey]) ||
  (FIXED_SLOTS[doc.formType] && FIXED_SLOTS[doc.formType][roleKey]) ||
  null;

/**
 * doc वर (Lipik च्या documents[] मधील एक) roleKey चा DSC लावतो.
 * Idempotent: त्या role ने आधीच sign केले असेल तर काही करत नाही.
 * @returns {Promise<boolean>} नवीन signature लागला का
 */
const applyDigitalSignature = async (doc, role, userWard, signer = {}) => {
  if (!DSC_ENABLED) return false;
  const roleKey = getRoleKey(role, userWard);
  if (!roleKey) return false;

  doc.signedRoles = doc.signedRoles || [];
  if (doc.signedRoles.some((s) => s.roleKey === roleKey)) return false;

  const slot = getSlot(doc, roleKey);
  if (!slot) {
    // या report वर या role साठी जागा नाही (उदा. Form 22 वर JE_HO) -> skip, workflow चालू राहतो
    console.warn(`No signature slot for ${roleKey} on ${doc.formType}; skipping DSC`);
    return false;
  }

  const outName = `signed_${doc.formNumber}_${roleKey}_${Date.now()}.pdf`;
  await axios.post(
    `${SIGN_SERVICE_URL}/sign`,
    {
      inputPath: doc.pdfFile,
      outputPath: outName,
      signerKey: roleKey, // dummy mode: role नुसार dummy certificate
      fieldName: `SIG_${roleKey}`,
      page: slot.page,
      box: slot.box,
      designation: DESIGNATION[roleKey],
      reason: "Approved",
    },
    { headers: { "X-Sign-Key": SIGN_SERVICE_KEY }, timeout: 60000 }
  );

  doc.pdfFile = path.posix.join("uploads", outName);
  doc.signedRoles.push({
    roleKey,
    userId: signer.userId,
    signerName: signer.name,
    signedAt: new Date(),
  });
  doc.lastUpdated = new Date();
  return true;
};

const verifyPdf = async (pdfFile) => {
  const { data } = await axios.post(
    `${SIGN_SERVICE_URL}/verify`,
    { path: pdfFile },
    { headers: { "X-Sign-Key": SIGN_SERVICE_KEY }, timeout: 60000 }
  );
  return data.signatures;
};

module.exports = { applyDigitalSignature, verifyPdf, getRoleKey, parseSlots, FIXED_SLOTS };
