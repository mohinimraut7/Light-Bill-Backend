// =====================================================================
// utils/digitalSignature.js
// Report PDF वर officer चा Digital Signature (DSC) लावणे - backend मध्येच (वेगळी service नाही).
//
// नियम (महत्त्वाचे):
//   * पहिला DSC लागल्यानंतर PDF कधीही pdf-lib ने पुन्हा save / removePage करायची नाही.
//     तसे केल्यास आधीचे सर्व signatures INVALID होतात.
//   * प्रत्येक approval = एक "incremental" signature (आधीचे signatures valid राहतात).
//   * सही कुठे लावायची ते doc.signatureSlots मध्ये असते
//       - Ward Bills / Form 22 : frontend PDF बनवतानाच slots पाठवतो (dynamic)
//       - कार्यालयीन टिपणी   : frontend slots पाठवतो, नसेल तर खालचे FIXED_SLOTS
//   * Sign करण्यासाठी officer चा token PIN ने unlock करावा लागतो (utils/dsc/dummyToken.js).
// =====================================================================
const fs = require("fs");
const path = require("path");
const { signPdf, verifyPdfSignatures, istStamp } = require("./dsc/pdfSigner");
const dummyToken = require("./dsc/dummyToken");

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads"));
const DSC_ENABLED = String(process.env.DSC_ENABLED || "true").toLowerCase() !== "false";
const LOCATION = "Vasai-Virar City Municipal Corporation";

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

// "uploads/abc.pdf", "/uploads/abc.pdf", "uploads\\abc.pdf" -> <backend>/uploads/abc.pdf
const uploadPath = (p) => {
  const name = String(p || "").replace(/\\/g, "/").split("/").pop();
  if (!name || !name.toLowerCase().endsWith(".pdf")) throw new Error(`Only .pdf allowed: ${p}`);
  return path.join(UPLOADS_DIR, name);
};

/** या role ला approve करताना DSC (PIN) लागेल का */
const needsDsc = (role, userWard, remark) =>
  DSC_ENABLED && remark === "Approved" && !!getRoleKey(role, userWard);

/**
 * PIN तपासून officer चा token उघडतो. Controller मध्ये request च्या सुरुवातीलाच call करा,
 * म्हणजे चुकीच्या PIN वर काहीच save होत नाही.
 */
const unlockSigner = async (userId, pin) => dummyToken.unlockToken(userId, pin);

/**
 * doc वर (Lipik च्या documents[] मधील एक) roleKey चा DSC लावतो.
 * Idempotent: त्या role ने आधीच sign केले असेल तर काही करत नाही.
 * @param signer { userId, token }  token = unlockSigner() चा result
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
    // या report वर या role साठी जागा नाही -> skip, workflow चालू राहतो
    console.warn(`No signature slot for ${roleKey} on ${doc.formType}; skipping DSC`);
    return false;
  }
  if (!signer.token) {
    throw new dummyToken.DscError("DSC_PIN_REQUIRED", "DSC PIN टाका.", 401);
  }

  const now = new Date();
  const input = fs.readFileSync(uploadPath(doc.pdfFile));
  const signed = await signPdf(
    input,
    {
      fieldName: `SIG_${roleKey}`,
      page: slot.page,
      box: slot.box,
      reason: "Approved",
      location: LOCATION,
      signerName: signer.token.subjectName,
      signingTime: now,
      lines: [
        "Digitally signed by",
        signer.token.subjectName,
        DESIGNATION[roleKey],
        `Date: ${istStamp(now)}`,
      ],
    },
    signer.token
  );

  const outName = `signed_${doc.formNumber}_${roleKey}_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(UPLOADS_DIR, outName), signed);

  doc.pdfFile = path.posix.join("uploads", outName);
  doc.signedRoles.push({
    roleKey,
    userId: signer.userId,
    signerName: signer.token.subjectName,
    tokenSerial: signer.token.tokenSerial,
    certSerial: signer.token.certSerial,
    signedAt: now,
  });
  doc.lastUpdated = now;
  return true;
};

const verifyPdf = async (pdfFile) =>
  verifyPdfSignatures(fs.readFileSync(uploadPath(pdfFile)), dummyToken.trustedRoots());

module.exports = {
  applyDigitalSignature,
  verifyPdf,
  getRoleKey,
  parseSlots,
  needsDsc,
  unlockSigner,
  DESIGNATION,
  FIXED_SLOTS,
};