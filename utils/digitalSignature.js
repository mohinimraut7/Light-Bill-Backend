// // =====================================================================
// // utils/digitalSignature.js
// // Report PDF वर officer चा Digital Signature (DSC) लावणे - backend मध्येच (वेगळी service नाही).
// //
// // नियम (महत्त्वाचे):
// //   * पहिला DSC लागल्यानंतर PDF कधीही pdf-lib ने पुन्हा save / removePage करायची नाही.
// //     तसे केल्यास आधीचे सर्व signatures INVALID होतात.
// //   * प्रत्येक approval = एक "incremental" signature (आधीचे signatures valid राहतात).
// //   * सही कुठे लावायची ते doc.signatureSlots मध्ये असते
// //       - Ward Bills / Form 22 : frontend PDF बनवतानाच slots पाठवतो (dynamic)
// //       - कार्यालयीन टिपणी   : frontend slots पाठवतो, नसेल तर खालचे FIXED_SLOTS
// //   * Sign करण्यासाठी officer चा token PIN ने unlock करावा लागतो (utils/dsc/dummyToken.js).
// // =====================================================================
// const fs = require("fs");
// const path = require("path");
// const { signPdf, verifyPdfSignatures, istStamp } = require("./dsc/pdfSigner");
// const dummyToken = require("./dsc/dummyToken");

// const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads"));
// const DSC_ENABLED = String(process.env.DSC_ENABLED || "true").toLowerCase() !== "false";
// const LOCATION = "Vasai-Virar City Municipal Corporation";

// // role + ward -> signature slot key
// const getRoleKey = (role, userWard) => {
//   if (role === "Lipik") return "LIPIK";
//   if (role === "Junior Engineer") return userWard === "Head Office" ? "JE_HO" : "JE_WARD";
//   if (role === "Accountant") return "ACCOUNTANT";
//   if (role === "Assistant Municipal Commissioner") return "AMC";
//   if (role === "Dy.Municipal Commissioner") return "DMC";
//   return null;
// };

// const DESIGNATION = {
//   LIPIK: "Lipik, Electrical Dept",
//   JE_WARD: "Junior Engineer (Ward)",
//   JE_HO: "Junior Engineer (Head Office)",
//   ACCOUNTANT: "Accountant",
//   AMC: "Asst. Municipal Commissioner",
//   DMC: "Dy. Municipal Commissioner",
// };

// // Frontend ने slots पाठवले नाहीत तर fallback (PDF points, A4 portrait 595x842, origin खाली-डावीकडे).
// // कार्यालयीन टिपणी मधील सध्याच्या jsPDF positions (mm) वरून काढलेले.
// const FIXED_SLOTS = {
//   karyalayintipani: {
//     LIPIK:      { page: 0, box: [103.5, 436.5, 250.9, 484.7] },
//     JE_WARD:    { page: 0, box: [273.5, 436.5, 420.9, 484.7] },
//     JE_HO:      { page: 0, box: [429.4, 436.5, 576.9, 484.7] },
//     ACCOUNTANT: { page: 0, box: [103.5, 82.2, 233.9, 130.4] },
//     AMC:        { page: 0, box: [306.1, 82.2, 436.5, 130.4] },
//     DMC:        { page: 0, box: [453.5, 82.2, 583.9, 130.4] },
//   },
// };

// const parseSlots = (raw) => {
//   if (!raw) return null;
//   try {
//     const slots = typeof raw === "string" ? JSON.parse(raw) : raw;
//     for (const [k, v] of Object.entries(slots)) {
//       if (!Number.isInteger(v.page) || !Array.isArray(v.box) || v.box.length !== 4) {
//         throw new Error(`bad slot ${k}`);
//       }
//     }
//     return slots;
//   } catch (e) {
//     console.warn("Invalid signatureSlots, ignoring:", e.message);
//     return null;
//   }
// };

// const getSlot = (doc, roleKey) =>
//   (doc.signatureSlots && doc.signatureSlots[roleKey]) ||
//   (FIXED_SLOTS[doc.formType] && FIXED_SLOTS[doc.formType][roleKey]) ||
//   null;

// // "uploads/abc.pdf", "/uploads/abc.pdf", "uploads\\abc.pdf" -> <backend>/uploads/abc.pdf
// const uploadPath = (p) => {
//   const name = String(p || "").replace(/\\/g, "/").split("/").pop();
//   if (!name || !name.toLowerCase().endsWith(".pdf")) throw new Error(`Only .pdf allowed: ${p}`);
//   return path.join(UPLOADS_DIR, name);
// };

// /** या role ला approve करताना DSC (PIN) लागेल का */
// const needsDsc = (role, userWard, remark) =>
//   DSC_ENABLED && remark === "Approved" && !!getRoleKey(role, userWard);

// /**
//  * PIN तपासून officer चा token उघडतो. Controller मध्ये request च्या सुरुवातीलाच call करा,
//  * म्हणजे चुकीच्या PIN वर काहीच save होत नाही.
//  */
// const unlockSigner = async (userId, pin) => dummyToken.unlockToken(userId, pin);

// /**
//  * doc वर (Lipik च्या documents[] मधील एक) roleKey चा DSC लावतो.
//  * Idempotent: त्या role ने आधीच sign केले असेल तर काही करत नाही.
//  * @param signer { userId, token }  token = unlockSigner() चा result
//  * @returns {Promise<boolean>} नवीन signature लागला का
//  */
// const applyDigitalSignature = async (doc, role, userWard, signer = {}) => {
//   if (!DSC_ENABLED) return false;
//   const roleKey = getRoleKey(role, userWard);
//   if (!roleKey) return false;

//   doc.signedRoles = doc.signedRoles || [];
//   if (doc.signedRoles.some((s) => s.roleKey === roleKey)) return false;

//   const slot = getSlot(doc, roleKey);
//   if (!slot) {
//     // या report वर या role साठी जागा नाही -> skip, workflow चालू राहतो
//     console.warn(`No signature slot for ${roleKey} on ${doc.formType}; skipping DSC`);
//     return false;
//   }
//   if (!signer.token) {
//     throw new dummyToken.DscError("DSC_PIN_REQUIRED", "DSC PIN टाका.", 401);
//   }

//   const now = new Date();
//   const input = fs.readFileSync(uploadPath(doc.pdfFile));
//   const signed = await signPdf(
//     input,
//     {
//       fieldName: `SIG_${roleKey}`,
//       page: slot.page,
//       box: slot.box,
//       reason: "Approved",
//       location: LOCATION,
//       signerName: signer.token.subjectName,
//       signingTime: now,
//       lines: [
//         "Digitally signed by",
//         signer.token.subjectName,
//         DESIGNATION[roleKey],
//         `Date: ${istStamp(now)}`,
//       ],
//     },
//     signer.token
//   );

//   const outName = `signed_${doc.formNumber}_${roleKey}_${Date.now()}.pdf`;
//   fs.writeFileSync(path.join(UPLOADS_DIR, outName), signed);

//   doc.pdfFile = path.posix.join("uploads", outName);
//   doc.signedRoles.push({
//     roleKey,
//     userId: signer.userId,
//     signerName: signer.token.subjectName,
//     tokenSerial: signer.token.tokenSerial,
//     certSerial: signer.token.certSerial,
//     signedAt: now,
//   });
//   doc.lastUpdated = now;
//   return true;
// };

// const verifyPdf = async (pdfFile) =>
//   verifyPdfSignatures(fs.readFileSync(uploadPath(pdfFile)), dummyToken.trustedRoots());

// module.exports = {
//   applyDigitalSignature,
//   verifyPdf,
//   getRoleKey,
//   parseSlots,
//   needsDsc,
//   unlockSigner,
//   DESIGNATION,
//   FIXED_SLOTS,
// };






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

// 23-Oct-2026: Digital signature (DSC token + PIN) नको -> officer ने upload केलेली साधी सही (image)
// त्याच्या जागेवर (slot) PDF मध्ये लावायची. SIGNATURE_MODE=dsc ठेवल्यास जुना DSC flow परत चालू होतो.
const SIGNATURE_MODE = String(process.env.SIGNATURE_MODE || "image").toLowerCase() === "dsc" ? "dsc" : "image";
const IMAGE_MODE = SIGNATURE_MODE === "image";
const SIG_IMAGE_RE = /^data:image\/(png|jpe?g);base64,/i;
const isSignatureImage = (sig) => typeof sig === "string" && SIG_IMAGE_RE.test(sig);
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
  // 23-Oct-2026: Energy Expenditure नवीन Head Office flow
  CLERK_E: "Clerk (Electrical)",
  JE: "Junior Engineer",
  SE: "Sectional Engineer",
  DE: "Deputy Engineer",
  EE: "Executive Engineer",
  CLERK_A: "Clerk (Accounts)",
  DY_CAFO: "Deputy CAFO",
  CAFO: "CAFO",
  AUDITOR: "Auditor",
  DY_CHIEF_AUDITOR: "Deputy Chief Auditor",
  CHIEF_AUDITOR: "Chief Auditor",
  ADDL_COMMISSIONER: "Additional Commissioner",
  RTGS: "RTGS Account Officer",
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
// const needsDsc = (role, userWard, remark) =>
//   DSC_ENABLED && remark === "Approved" && !!getRoleKey(role, userWard);
// 23-Oct-2026: image mode मध्ये PIN लागत नाही
const needsDsc = (role, userWard, remark) =>
  !IMAGE_MODE && DSC_ENABLED && remark === "Approved" && !!getRoleKey(role, userWard);

/** 23-Oct-2026: या role ला approve करताना सहीची image लागेल का (image mode) */
const needsSignatureImage = (role, userWard, remark) =>
  IMAGE_MODE && remark === "Approved" && !!getRoleKey(role, userWard);

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
  // 23-Oct-2026: साधी सही (image) -> खालचा DSC भाग वापरला जात नाही
  if (IMAGE_MODE) return applyImageSignature(doc, role, userWard, signer);
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

// =====================================================================
// 23-Oct-2026: साधी सही (uploaded image) PDF वर त्या role च्या जागेवर लावणे
//   * signer.signature = "data:image/png;base64,..." (officer ने upload केलेली)
//   * Box मध्ये वर सहीची image, खाली नाव / पद / तारीख
//   * Idempotent: त्या role ची सही आधीच लागली असेल तर काही करत नाही
// =====================================================================
const asciiOnly = (t) => String(t || "").replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();

const applyImageSignature = async (doc, role, userWard, signer = {}) =>
  applySignatureForKey(doc, getRoleKey(role, userWard), signer);

// 23-Oct-2026: roleKey थेट देऊन सही लावणे (नवीन Energy Expenditure flow)
const applySignatureForKey = async (doc, roleKey, signer = {}) => {
  if (!roleKey) return false;

  doc.signedRoles = doc.signedRoles || [];
  if (doc.signedRoles.some((s) => s.roleKey === roleKey)) return false;

  const slot = getSlot(doc, roleKey);
  if (!slot) {
    console.warn(`No signature slot for ${roleKey} on ${doc.formType}; skipping signature`);
    return false;
  }
  if (!isSignatureImage(signer.signature)) {
    const err = new Error("सहीची image upload करा.");
    err.code = "SIGNATURE_REQUIRED";
    err.status = 400;
    throw err;
  }

  const PDFLib = require("pdf-lib");
  const now = new Date();
  const pdfDoc = await PDFLib.PDFDocument.load(fs.readFileSync(uploadPath(doc.pdfFile)), { ignoreEncryption: true });
  const pages = pdfDoc.getPages();
  const page = pages[Math.min(Math.max(slot.page, 0), pages.length - 1)];

  const [x1, y1, x2, y2] = slot.box.map(Number);
  const bx = Math.min(x1, x2);
  const by = Math.min(y1, y2);
  const bw = Math.abs(x2 - x1);
  const bh = Math.abs(y2 - y1);

  const bytes = Buffer.from(signer.signature.split(",")[1], "base64");
  const img = /png/i.test(signer.signature.slice(0, 30)) ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

  const name = asciiOnly(signer.signerName);
  const lines = [name, DESIGNATION[roleKey], istStamp(now)].filter(Boolean);
  const fontSize = Math.max(4.5, Math.min(7, (bh * 0.42) / (lines.length * 1.15)));
  const textH = lines.length * fontSize * 1.15 + 2;

  // वरचा भाग: सहीची image (aspect ratio राखून)
  const imgAreaH = Math.max(bh - textH - 2, bh * 0.45);
  const scale = Math.min((bw - 4) / img.width, imgAreaH / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  page.drawImage(img, { x: bx + (bw - iw) / 2, y: by + bh - ih - 1, width: iw, height: ih });

  // खालचा भाग: नाव / पद / तारीख
  lines.forEach((line, i) => {
    let size = fontSize;
    while (size > 3.5 && font.widthOfTextAtSize(line, size) > bw - 4) size -= 0.25;
    const w = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: bx + Math.max(2, (bw - w) / 2),
      y: by + 2 + (lines.length - 1 - i) * fontSize * 1.15,
      size,
      font,
      color: PDFLib.rgb(0.15, 0.15, 0.15),
    });
  });

  const outName = `signed_${doc.formNumber}_${roleKey}_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(UPLOADS_DIR, outName), await pdfDoc.save());

  doc.pdfFile = path.posix.join("uploads", outName);
  doc.signedRoles.push({
    roleKey,
    userId: signer.userId,
    signerName: signer.signerName || "",
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
  needsSignatureImage,
  isSignatureImage,
  applySignatureForKey,
  SIGNATURE_MODE,
  unlockSigner,
  DESIGNATION,
  FIXED_SLOTS,
};