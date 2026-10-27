// // // =====================================================================
// // // 23-Oct-2026: Energy Expenditure — नवीन Head Office approval flow
// // // POST /api/addRemarkReport (controller/reports.js मधील addRemarkReports इथे पाठवतो)
// // //
// // // नियम:
// // //  * सर्व users Head Office चे. Report = (महिना + निवडलेला ward), flow: "HO".
// // //  * पहिला step Clerk (Electrical): Ward Bills / Form 22 / कार्यालयीन टिपणी upload करतो.
// // //  * पुढचा step approve करू शकतो फक्त जेव्हा मागच्या step ने तिन्ही forms approve केले असतील.
// // //  * Approve -> सहीची image त्या step च्या जागेवर PDF मध्ये लागते.
// // //  * Reject  -> तो form मागच्या step कडे परत (मागचा step पुन्हा approve / reject करतो).
// // //  * पुढच्या step ने approve केल्यानंतर स्वतःचा निर्णय बदलता येत नाही.
// // // =====================================================================
// // const fs = require("fs");
// // const mongoose = require("mongoose");
// // const Report = require("../models/report");
// // const User = require("../models/user");
// // const { parseSlots, isSignatureImage, applySignatureForKey } = require("../utils/digitalSignature");
// // const { ENERGY_FLOW, FLOW_WARD, REQUIRED_FORM_TYPES, getStepIndex } = require("../utils/energyFlow");

// // const FORM_LABEL = {
// //   wardbilllist: "Ward Bills",
// //   form22: "Form 22",
// //   karyalayintipani: "Karyalayin Tipani",
// //   faultymeter: "Faulty Meter",
// // };
// // const formLabel = (t) => FORM_LABEL[t] || t;

// // const generateFormNumber = async (formType) => {
// //   const d = new Date();
// //   const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
// //   const count = (await Report.countDocuments()) + 1;
// //   return `${formType}-${ymd}-${count}`;
// // };

// // const statusOf = (doc, key) => (doc?.stepStatus || []).find((s) => s.roleKey === key)?.status;
// // const isApproved = (doc, key) => statusOf(doc, key) === "Approved";

// // const setStatus = (doc, step, status, userId) => {
// //   doc.stepStatus = doc.stepStatus || [];
// //   const existing = doc.stepStatus.find((s) => s.roleKey === step.key);
// //   if (existing) {
// //     existing.status = status;
// //     existing.date = new Date();
// //     if (userId) existing.userId = userId;
// //   } else {
// //     doc.stepStatus.push({ roleKey: step.key, role: step.label, userId, status, date: new Date() });
// //   }
// // };

// // // जुन्या screens साठी approvedBy / doneBy पण stepStatus वरून भरतो
// // const syncLegacyFields = (doc, wardName) => {
// //   const approved = (doc.stepStatus || []).filter((s) => s.status === "Approved" && s.userId);
// //   doc.approvedBy = approved.map((s) => s.userId);
// //   doc.doneBy = approved.map((s) => ({
// //     formType: doc.formType,
// //     userId: s.userId,
// //     role: s.role,
// //     status: "verified",
// //     ward: wardName,
// //     userWard: FLOW_WARD,
// //   }));
// // };

// // exports.addRemarkReportsHO = async (req, res) => {
// //   const dropUpload = () => {
// //     if (req.file) fs.unlink(req.file.path, () => {});
// //   };
// //   try {
// //     const { userId, remark, signature, formType, seleMonth, wardName } = req.body;

// //     const missing = [];
// //     if (!userId) missing.push("userId");
// //     if (!remark) missing.push("remark");
// //     if (!formType) missing.push("formType");
// //     if (!seleMonth) missing.push("seleMonth");
// //     if (missing.length) {
// //       dropUpload();
// //       return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });
// //     }
// //     if (!wardName) {
// //       dropUpload();
// //       return res.status(400).json({ message: "आधी Ward निवडा. (Please select a ward first.)" });
// //     }
// //     if (!["Approved", "Rejected"].includes(remark)) {
// //       dropUpload();
// //       return res.status(400).json({ message: "Remark Approved किंवा Rejected असावा." });
// //     }
// //     if (!mongoose.Types.ObjectId.isValid(userId)) {
// //       dropUpload();
// //       return res.status(400).json({ message: "Invalid user." });
// //     }

// //     // role / department / ward DB मधून (frontend वर अवलंबून नाही)
// //     const user = await User.findById(userId).select("username role department ward signature");
// //     if (!user) {
// //       dropUpload();
// //       return res.status(404).json({ message: "User not found." });
// //     }
// //     const stepIdx = getStepIndex(user.role, user.department);
// //     if (stepIdx === -1) {
// //       dropUpload();
// //       const hint = user.role === "Clerk" ? " (Clerk साठी Department Electrical / Accounts set करा)" : "";
// //       return res.status(403).json({ message: `${user.role} हा role Energy Expenditure approval flow मध्ये नाही${hint}.` });
// //     }
// //     if (user.ward !== FLOW_WARD) {
// //       dropUpload();
// //       return res.status(403).json({ message: `Energy Expenditure approval फक्त Head Office users करू शकतात. तुमचा ward: ${user.ward || "-"}` });
// //     }

// //     const step = ENERGY_FLOW[stepIdx];
// //     const prevStep = stepIdx > 0 ? ENERGY_FLOW[stepIdx - 1] : null;
// //     const nextStep = ENERGY_FLOW[stepIdx + 1] || null;
// //     const isRequired = REQUIRED_FORM_TYPES.includes(formType);

// //     if (remark === "Approved" && isRequired && !isSignatureImage(signature)) {
// //       dropUpload();
// //       return res.status(400).json({ message: "Approve करण्यासाठी सही (signature image) upload करा.", code: "SIGNATURE_REQUIRED" });
// //     }

// //     let report = await Report.findOne({ seleMonth, ward: wardName, flow: "HO" });
// //     if (!report) {
// //       if (stepIdx !== 0) {
// //         dropUpload();
// //         return res.status(400).json({ message: `${wardName} - ${seleMonth}: Clerk (Electrical) ने अजून reports upload केलेले नाहीत.` });
// //       }
// //       report = new Report({ seleMonth, ward: wardName, monthReport: seleMonth, flow: "HO", reportingRemarks: [] });
// //     }

// //     // Documents नेहमी Clerk (Electrical) च्या remark मध्ये असतात
// //     let owner = report.reportingRemarks.find((r) => r.roleKey === "CLERK_E");
// //     if (!owner && stepIdx === 0) {
// //       report.reportingRemarks.push({
// //         userId: user._id, role: user.role, roleKey: step.key, department: user.department,
// //         remark, signature, ward: wardName, userWard: user.ward, date: new Date(), documents: [],
// //       });
// //       owner = report.reportingRemarks[report.reportingRemarks.length - 1];
// //     }
// //     const docs = owner ? owner.documents : [];
// //     let doc = docs.find((d) => d.formType === formType);

// //     if (stepIdx === 0) {
// //       // ---------- Clerk (Electrical): upload / replace ----------
// //       const laterApproved = doc && ENERGY_FLOW.slice(1).find((s) => isApproved(doc, s.key));
// //       if (req.file && remark !== "Approved") dropUpload(); // Reject वेळी नवीन PDF घेत नाही
// //       if (req.file && remark === "Approved") {
// //         if (laterApproved) {
// //           dropUpload();
// //           return res.status(409).json({ message: `${formLabel(formType)} ${laterApproved.label} ने approve केला आहे. आता बदलता येणार नाही.` });
// //         }
// //         const slots = parseSlots(req.body.signatureSlots);
// //         if (doc) {
// //           // नवीन PDF -> आधीच्या सर्व सह्या / निर्णय रद्द
// //           doc.pdfFile = req.file.path;
// //           doc.uploadedAt = new Date();
// //           doc.signatureSlots = slots;
// //           doc.signedRoles = [];
// //           doc.stepStatus = [];
// //         } else {
// //           docs.push({
// //             formType,
// //             formNumber: await generateFormNumber(formType),
// //             pdfFile: req.file.path,
// //             uploadedAt: new Date(),
// //             signatureSlots: slots,
// //             signedRoles: [],
// //             stepStatus: [],
// //             approvedBy: [],
// //             doneBy: [],
// //           });
// //           doc = docs[docs.length - 1];
// //         }
// //       } else if (!doc) {
// //         return res.status(400).json({ message: `${formLabel(formType)} ची PDF मिळाली नाही.` });
// //       } else if (laterApproved) {
// //         return res.status(409).json({ message: `${formLabel(formType)} ${laterApproved.label} ने approve केला आहे. आता बदलता येणार नाही.` });
// //       }
// //     } else {
// //       // ---------- बाकी steps ----------
// //       dropUpload(); // PDF फक्त Clerk (Electrical) upload करतो
// //       if (!doc) {
// //         return res.status(400).json({ message: `Clerk (Electrical) ने ${formLabel(formType)} अजून upload केलेला नाही.` });
// //       }
// //       if (remark === "Approved" && isRequired) {
// //         const pending = REQUIRED_FORM_TYPES.filter((t) => !isApproved(docs.find((d) => d.formType === t), prevStep.key));
// //         if (pending.length) {
// //           return res.status(400).json({
// //             message: `${prevStep.label} ने आधी सर्व forms approve करायला हवेत. बाकी: ${pending.map(formLabel).join(", ")}`,
// //           });
// //         }
// //       } else if (!isApproved(doc, prevStep.key)) {
// //         return res.status(400).json({ message: `${prevStep.label} ने ${formLabel(formType)} अजून approve केलेला नाही.` });
// //       }
// //       if (nextStep && isApproved(doc, nextStep.key)) {
// //         return res.status(409).json({ message: `${nextStep.label} ने ${formLabel(formType)} approve केला आहे. आता निर्णय बदलता येणार नाही.` });
// //       }
// //     }

// //     // ---------- निर्णय नोंदवा ----------
// //     setStatus(doc, step, remark, user._id);
// //     if (remark === "Rejected" && prevStep) {
// //       // ↕ मागच्या step कडे परत
// //       setStatus(doc, prevStep, "SentBack");
// //     }
// //     if (remark === "Approved" && isRequired) {
// //       await applySignatureForKey(doc, step.key, { userId: user._id, signature, signerName: user.username || "" });
// //     }
// //     doc.lastUpdated = new Date();
// //     syncLegacyFields(doc, wardName);

// //     // या step चा remark (एक step = एक entry)
// //     const entry = report.reportingRemarks.find((r) => r.roleKey === step.key);
// //     if (entry) {
// //       entry.userId = user._id;
// //       entry.role = user.role;
// //       entry.department = user.department;
// //       entry.remark = remark;
// //       if (signature) entry.signature = signature;
// //       entry.userWard = user.ward;
// //       entry.ward = wardName;
// //       entry.date = new Date();
// //     } else {
// //       report.reportingRemarks.push({
// //         userId: user._id, role: user.role, roleKey: step.key, department: user.department,
// //         remark, signature, ward: wardName, userWard: user.ward, date: new Date(), documents: [],
// //       });
// //     }

// //     // वापरलेली सही पुढच्या वेळेसाठी user वर
// //     if (remark === "Approved" && isSignatureImage(signature) && user.signature !== signature) {
// //       await User.updateOne({ _id: user._id }, { $set: { signature } });
// //     }

// //     report.markModified("reportingRemarks");
// //     await report.save();

// //     const msg =
// //       remark === "Approved"
// //         ? `${formLabel(formType)} approved${nextStep ? ` → ${nextStep.label}` : " (flow पूर्ण)"}`
// //         : `${formLabel(formType)} rejected${prevStep ? ` → परत ${prevStep.label} कडे` : ""}`;
// //     return res.status(201).json({ message: msg, report });
// //   } catch (error) {
// //     console.error("🚨 addRemarkReportsHO error:", error);
// //     dropUpload();
// //     if (error.code === "SIGNATURE_REQUIRED" || String(error.code || "").startsWith("DSC_")) {
// //       return res.status(error.status || 400).json({ message: error.message, code: error.code });
// //     }
// //     return res.status(500).json({ message: "Error while saving report.", error: error.message });
// //   }
// // };





// // =====================================================================
// // 23-Oct-2026: Energy Expenditure — नवीन Head Office approval flow
// // POST /api/addRemarkReport (controller/reports.js मधील addRemarkReports इथे पाठवतो)
// //
// // नियम:
// //  * सर्व users Head Office चे. Report = (महिना + निवडलेला ward), flow: "HO".
// //  * पहिला step Clerk (Electrical): Ward Bills / Form 22 / कार्यालयीन टिपणी upload करतो.
// //  * पुढचा step approve करू शकतो फक्त जेव्हा मागच्या step ने तिन्ही forms approve केले असतील.
// //  * Approve -> सहीची image त्या step च्या जागेवर PDF मध्ये लागते.
// //  * Reject  -> तो form मागच्या step कडे परत (मागचा step पुन्हा approve / reject करतो).
// //  * पुढच्या step ने approve केल्यानंतर स्वतःचा निर्णय बदलता येत नाही.
// // =====================================================================
// const fs = require("fs");
// const mongoose = require("mongoose");
// const Report = require("../models/report");
// const User = require("../models/user");
// const { parseSlots, isSignatureImage, applySignatureForKey } = require("../utils/digitalSignature");
// const { ENERGY_FLOW, FLOW_WARD, REQUIRED_FORM_TYPES, getStepIndex } = require("../utils/energyFlow");

// const FORM_LABEL = {
//   wardbilllist: "Ward Bills",
//   form22: "Form 22",
//   karyalayintipani: "Karyalayin Tipani",
//   faultymeter: "Faulty Meter",
// };
// const formLabel = (t) => FORM_LABEL[t] || t;

// const generateFormNumber = async (formType) => {
//   const d = new Date();
//   const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
//   const count = (await Report.countDocuments()) + 1;
//   return `${formType}-${ymd}-${count}`;
// };

// const statusOf = (doc, key) => (doc?.stepStatus || []).find((s) => s.roleKey === key)?.status;
// const isApproved = (doc, key) => statusOf(doc, key) === "Approved";

// const setStatus = (doc, step, status, userId) => {
//   doc.stepStatus = doc.stepStatus || [];
//   const existing = doc.stepStatus.find((s) => s.roleKey === step.key);
//   if (existing) {
//     existing.status = status;
//     existing.date = new Date();
//     if (userId) existing.userId = userId;
//   } else {
//     doc.stepStatus.push({ roleKey: step.key, role: step.label, userId, status, date: new Date() });
//   }
// };

// // जुन्या screens साठी approvedBy / doneBy पण stepStatus वरून भरतो
// const syncLegacyFields = (doc, wardName) => {
//   const approved = (doc.stepStatus || []).filter((s) => s.status === "Approved" && s.userId);
//   doc.approvedBy = approved.map((s) => s.userId);
//   doc.doneBy = approved.map((s) => ({
//     formType: doc.formType,
//     userId: s.userId,
//     role: s.role,
//     status: "verified",
//     ward: wardName,
//     userWard: FLOW_WARD,
//   }));
// };

// exports.addRemarkReportsHO = async (req, res) => {
//   const dropUpload = () => {
//     if (req.file) fs.unlink(req.file.path, () => {});
//   };
//   try {
//     const { userId, remark, signature, formType, seleMonth, wardName } = req.body;

//     const missing = [];
//     if (!userId) missing.push("userId");
//     if (!remark) missing.push("remark");
//     if (!formType) missing.push("formType");
//     if (!seleMonth) missing.push("seleMonth");
//     if (missing.length) {
//       dropUpload();
//       return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });
//     }
//     if (!wardName) {
//       dropUpload();
//       return res.status(400).json({ message: "आधी Ward निवडा. (Please select a ward first.)" });
//     }
//     // 23-Oct-2026: "Send Back" = report मागच्या step कडे परत (Rejected सारखाच, पण नाव स्पष्ट)
//     if (!["Approved", "Rejected", "Send Back"].includes(remark)) {
//       dropUpload();
//       return res.status(400).json({ message: "Remark Approved, Rejected किंवा Send Back असावा." });
//     }
//     const isReturn = remark === "Rejected" || remark === "Send Back";
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       dropUpload();
//       return res.status(400).json({ message: "Invalid user." });
//     }

//     // role / department / ward DB मधून (frontend वर अवलंबून नाही)
//     const user = await User.findById(userId).select("username role department ward signature");
//     if (!user) {
//       dropUpload();
//       return res.status(404).json({ message: "User not found." });
//     }
//     const stepIdx = getStepIndex(user.role, user.department);
//     if (stepIdx === -1) {
//       dropUpload();
//       const hint = user.role === "Clerk" ? " (Clerk साठी Department Electrical / Accounts set करा)" : "";
//       return res.status(403).json({ message: `${user.role} हा role Energy Expenditure approval flow मध्ये नाही${hint}.` });
//     }
//     if (user.ward !== FLOW_WARD) {
//       dropUpload();
//       return res.status(403).json({ message: `Energy Expenditure approval फक्त Head Office users करू शकतात. तुमचा ward: ${user.ward || "-"}` });
//     }

//     const step = ENERGY_FLOW[stepIdx];
//     const prevStep = stepIdx > 0 ? ENERGY_FLOW[stepIdx - 1] : null;
//     const nextStep = ENERGY_FLOW[stepIdx + 1] || null;
//     const isRequired = REQUIRED_FORM_TYPES.includes(formType);

//     if (remark === "Approved" && isRequired && !isSignatureImage(signature)) {
//       dropUpload();
//       return res.status(400).json({ message: "Approve करण्यासाठी सही (signature image) upload करा.", code: "SIGNATURE_REQUIRED" });
//     }

//     let report = await Report.findOne({ seleMonth, ward: wardName, flow: "HO" });
//     if (!report) {
//       if (stepIdx !== 0) {
//         dropUpload();
//         return res.status(400).json({ message: `${wardName} - ${seleMonth}: Clerk (Electrical) ने अजून reports upload केलेले नाहीत.` });
//       }
//       report = new Report({ seleMonth, ward: wardName, monthReport: seleMonth, flow: "HO", reportingRemarks: [] });
//     }

//     // Documents नेहमी Clerk (Electrical) च्या remark मध्ये असतात
//     let owner = report.reportingRemarks.find((r) => r.roleKey === "CLERK_E");
//     if (!owner && stepIdx === 0) {
//       report.reportingRemarks.push({
//         userId: user._id, role: user.role, roleKey: step.key, department: user.department,
//         remark, signature, ward: wardName, userWard: user.ward, date: new Date(), documents: [],
//       });
//       owner = report.reportingRemarks[report.reportingRemarks.length - 1];
//     }
//     const docs = owner ? owner.documents : [];
//     let doc = docs.find((d) => d.formType === formType);

//     if (stepIdx === 0) {
//       // ---------- Clerk (Electrical): upload / replace ----------
//       const laterApproved = doc && ENERGY_FLOW.slice(1).find((s) => isApproved(doc, s.key));
//       if (req.file && remark !== "Approved") dropUpload(); // Reject वेळी नवीन PDF घेत नाही
//       if (req.file && remark === "Approved") {
//         if (laterApproved) {
//           dropUpload();
//           return res.status(409).json({ message: `${formLabel(formType)} ${laterApproved.label} ने approve केला आहे. आता बदलता येणार नाही.` });
//         }
//         const slots = parseSlots(req.body.signatureSlots);
//         if (doc) {
//           // नवीन PDF -> आधीच्या सर्व सह्या / निर्णय रद्द
//           doc.pdfFile = req.file.path;
//           doc.uploadedAt = new Date();
//           doc.signatureSlots = slots;
//           doc.signedRoles = [];
//           doc.stepStatus = [];
//         } else {
//           docs.push({
//             formType,
//             formNumber: await generateFormNumber(formType),
//             pdfFile: req.file.path,
//             uploadedAt: new Date(),
//             signatureSlots: slots,
//             signedRoles: [],
//             stepStatus: [],
//             approvedBy: [],
//             doneBy: [],
//           });
//           doc = docs[docs.length - 1];
//         }
//       } else if (!doc) {
//         return res.status(400).json({ message: `${formLabel(formType)} ची PDF मिळाली नाही.` });
//       } else if (laterApproved) {
//         return res.status(409).json({ message: `${formLabel(formType)} ${laterApproved.label} ने approve केला आहे. आता बदलता येणार नाही.` });
//       }
//     } else {
//       // ---------- बाकी steps ----------
//       dropUpload(); // PDF फक्त Clerk (Electrical) upload करतो
//       if (!doc) {
//         return res.status(400).json({ message: `Clerk (Electrical) ने ${formLabel(formType)} अजून upload केलेला नाही.` });
//       }
//       if (remark === "Approved" && isRequired) {
//         const pending = REQUIRED_FORM_TYPES.filter((t) => !isApproved(docs.find((d) => d.formType === t), prevStep.key));
//         if (pending.length) {
//           return res.status(400).json({
//             message: `${prevStep.label} ने आधी सर्व forms approve करायला हवेत. बाकी: ${pending.map(formLabel).join(", ")}`,
//           });
//         }
//       } else if (!isApproved(doc, prevStep.key)) {
//         return res.status(400).json({ message: `${prevStep.label} ने ${formLabel(formType)} अजून approve केलेला नाही.` });
//       }
//       if (nextStep && isApproved(doc, nextStep.key)) {
//         return res.status(409).json({ message: `${nextStep.label} ने ${formLabel(formType)} approve केला आहे. आता निर्णय बदलता येणार नाही.` });
//       }
//     }

//     // ---------- निर्णय नोंदवा ----------
//     setStatus(doc, step, remark === "Send Back" ? "Returned" : remark, user._id);
//     if (isReturn && prevStep) {
//       // ↕ मागच्या step कडे परत
//       setStatus(doc, prevStep, "SentBack");
//     }
//     if (remark === "Approved" && isRequired) {
//       await applySignatureForKey(doc, step.key, { userId: user._id, signature, signerName: user.username || "" });
//     }
//     doc.lastUpdated = new Date();
//     syncLegacyFields(doc, wardName);

//     // या step चा remark (एक step = एक entry)
//     const entry = report.reportingRemarks.find((r) => r.roleKey === step.key);
//     if (entry) {
//       entry.userId = user._id;
//       entry.role = user.role;
//       entry.department = user.department;
//       entry.remark = remark;
//       if (signature) entry.signature = signature;
//       entry.userWard = user.ward;
//       entry.ward = wardName;
//       entry.date = new Date();
//     } else {
//       report.reportingRemarks.push({
//         userId: user._id, role: user.role, roleKey: step.key, department: user.department,
//         remark, signature, ward: wardName, userWard: user.ward, date: new Date(), documents: [],
//       });
//     }

//     // वापरलेली सही पुढच्या वेळेसाठी user वर
//     if (remark === "Approved" && isSignatureImage(signature) && user.signature !== signature) {
//       await User.updateOne({ _id: user._id }, { $set: { signature } });
//     }

//     report.markModified("reportingRemarks");
//     await report.save();

//     const msg =
//       remark === "Approved"
//         ? `${formLabel(formType)} approved${nextStep ? ` → ${nextStep.label}` : " (flow पूर्ण)"}`
//         : `${formLabel(formType)} ${remark === "Send Back" ? "sent back" : "rejected"}${prevStep ? ` → परत ${prevStep.label} कडे` : ""}`;
//     return res.status(201).json({ message: msg, report });
//   } catch (error) {
//     console.error("🚨 addRemarkReportsHO error:", error);
//     dropUpload();
//     if (error.code === "SIGNATURE_REQUIRED" || String(error.code || "").startsWith("DSC_")) {
//       return res.status(error.status || 400).json({ message: error.message, code: error.code });
//     }
//     return res.status(500).json({ message: "Error while saving report.", error: error.message });
//   }
// };




// =====================================================================
// 23-Oct-2026: Energy Expenditure — नवीन Head Office approval flow
// POST /api/addRemarkReport (controller/reports.js मधील addRemarkReports इथे पाठवतो)
//
// नियम:
//  * सर्व users Head Office चे. Report = (महिना + निवडलेला ward), flow: "HO".
//  * पहिला step Clerk (Electrical): Ward Bills / Form 22 / कार्यालयीन टिपणी upload करतो.
//  * पुढचा step approve करू शकतो फक्त जेव्हा मागच्या step ने तिन्ही forms approve केले असतील.
//  * Approve -> सहीची image त्या step च्या जागेवर PDF मध्ये लागते.
//  * Reject  -> तो form मागच्या step कडे परत (मागचा step पुन्हा approve / reject करतो).
//  * पुढच्या step ने approve केल्यानंतर स्वतःचा निर्णय बदलता येत नाही.
// =====================================================================
const fs = require("fs");
const mongoose = require("mongoose");
const Report = require("../models/report");
const User = require("../models/user");
// const { parseSlots, isSignatureImage, applySignatureForKey } = require("../utils/digitalSignature");
// const { ENERGY_FLOW, FLOW_WARD, REQUIRED_FORM_TYPES, getStepIndex } = require("../utils/energyFlow");

const { parseSlots, isSignatureImage, applySignatureForKey } = require("../utils/digitalSignature");
const { ENERGY_FLOW, FLOW_WARD, REQUIRED_FORM_TYPES, getStepIndex } = require("../utils/energyFlow");
const { isNoteImage, saveNoteImage, appendNoting, reapplyNotings } = require("../utils/tipaniNotings"); // 27-Oct-2026: टिपणी Notings

const FORM_LABEL = {
  wardbilllist: "Ward Bills",
  form22: "Form 22",
  karyalayintipani: "Karyalayin Tipani",
  faultymeter: "Faulty Meter",
};
const formLabel = (t) => FORM_LABEL[t] || t;

const generateFormNumber = async (formType) => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const count = (await Report.countDocuments()) + 1;
  return `${formType}-${ymd}-${count}`;
};

const statusOf = (doc, key) => (doc?.stepStatus || []).find((s) => s.roleKey === key)?.status;
const isApproved = (doc, key) => statusOf(doc, key) === "Approved";

// const setStatus = (doc, step, status, userId) => {
//   doc.stepStatus = doc.stepStatus || [];
//   const existing = doc.stepStatus.find((s) => s.roleKey === step.key);
//   if (existing) {
//     existing.status = status;
//     existing.date = new Date();
//     if (userId) existing.userId = userId;
//   } else {
//     doc.stepStatus.push({ roleKey: step.key, role: step.label, userId, status, date: new Date() });
//   }
// };


// 24-Oct-2026: reason (Rejected / Send Back चे कारण) पण save होतो. reason दिला नाही तर आधीसारखेच.
// const setStatus = (doc, step, status, userId, reason) => {
//   doc.stepStatus = doc.stepStatus || [];
//   const existing = doc.stepStatus.find((s) => s.roleKey === step.key);
//   if (existing) {
//     existing.status = status;
//     existing.date = new Date();
//     if (userId) existing.userId = userId;
//     if (reason) existing.reason = reason;
//   } else {
//     doc.stepStatus.push({ roleKey: step.key, role: step.label, userId, status, date: new Date(), ...(reason ? { reason } : {}) });
//   }
// };


// 24-Oct-2026: + Approved चे description, approval count आणि decisionHistory.
// Count: हा step "Approved" नसताना Approved झाला तरच +1 (approve -> send back -> परत approve = 2).
// Count decisionHistory वरून काढतो, म्हणून नवीन PDF मुळे stepStatus reset झाला तरी count टिकतो.
const setStatus = (doc, step, status, userId, reason, description) => {
  doc.stepStatus = doc.stepStatus || [];
  doc.decisionHistory = doc.decisionHistory || [];
  const existing = doc.stepStatus.find((s) => s.roleKey === step.key);
  const pastApprovals = doc.decisionHistory.filter((h) => h.roleKey === step.key && h.status === "Approved" && h.approvalNo).length;
  const isNewApproval = status === "Approved" && (!existing || existing.status !== "Approved");
  const approvalCount = isNewApproval ? pastApprovals + 1 : pastApprovals;
  if (existing) {
    existing.status = status;
    existing.date = new Date();
    if (userId) existing.userId = userId;
    if (reason) existing.reason = reason;
    if (description) existing.description = description;
    existing.approvalCount = approvalCount;
  } else {
    doc.stepStatus.push({
      roleKey: step.key, role: step.label, userId, status, date: new Date(),
      ...(reason ? { reason } : {}), ...(description ? { description } : {}), approvalCount,
    });
  }
  doc.decisionHistory.push({
    roleKey: step.key, role: step.label, userId, status, date: new Date(),
    ...(reason ? { reason } : {}), ...(description ? { description } : {}),
    ...(isNewApproval ? { approvalNo: approvalCount } : {}),
  });
};

// जुन्या screens साठी approvedBy / doneBy पण stepStatus वरून भरतो
const syncLegacyFields = (doc, wardName) => {
  const approved = (doc.stepStatus || []).filter((s) => s.status === "Approved" && s.userId);
  doc.approvedBy = approved.map((s) => s.userId);
  doc.doneBy = approved.map((s) => ({
    formType: doc.formType,
    userId: s.userId,
    role: s.role,
    status: "verified",
    ward: wardName,
    userWard: FLOW_WARD,
  }));
};

exports.addRemarkReportsHO = async (req, res) => {
  const dropUpload = () => {
    if (req.file) fs.unlink(req.file.path, () => {});
  };
  try {
    // const { userId, remark, signature, formType, seleMonth, wardName } = req.body;

        const { userId, remark, signature, formType, seleMonth, wardName } = req.body;
    // 24-Oct-2026: Rejected / Send Back चे कारण (optional - जुन्या screens reason पाठवत नाहीत)
    // const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";

        const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 1000) : "";
    // 24-Oct-2026: Approved चे description (optional)
    const description = typeof req.body.description === "string" ? req.body.description.trim().slice(0, 1000) : "";

    const missing = [];
    if (!userId) missing.push("userId");
    if (!remark) missing.push("remark");
    if (!formType) missing.push("formType");
    if (!seleMonth) missing.push("seleMonth");
    if (missing.length) {
      dropUpload();
      return res.status(400).json({ message: `Missing: ${missing.join(", ")}` });
    }
    // if (!wardName) {
    //   dropUpload();
    //   return res.status(400).json({ message: "आधी Ward निवडा. (Please select a ward first.)" });
    // }
    // 23-Oct-2026: Head Office user सर्व wards (ward निवडला नाही -> "Head Office" report)
    // किंवा एखादा specific ward निवडू शकतो -> प्रत्येकाचा वेगळा report व वेगळा flow
    const reportWard = wardName || FLOW_WARD;
    const reportLabel = wardName ? wardName : "सर्व प्रभाग";
    // 23-Oct-2026: "Send Back" = report मागच्या step कडे परत (Rejected सारखाच, पण नाव स्पष्ट)
    if (!["Approved", "Rejected", "Send Back"].includes(remark)) {
      dropUpload();
      return res.status(400).json({ message: "Remark Approved, Rejected किंवा Send Back असावा." });
    }
    const isReturn = remark === "Rejected" || remark === "Send Back";
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      dropUpload();
      return res.status(400).json({ message: "Invalid user." });
    }

    // role / department / ward DB मधून (frontend वर अवलंबून नाही)
    const user = await User.findById(userId).select("username role department ward signature");
    if (!user) {
      dropUpload();
      return res.status(404).json({ message: "User not found." });
    }
    const stepIdx = getStepIndex(user.role, user.department);
    if (stepIdx === -1) {
      dropUpload();
      const hint = user.role === "Clerk" ? " (Clerk साठी Department Electrical / Accounts set करा)" : "";
      return res.status(403).json({ message: `${user.role} हा role Energy Expenditure approval flow मध्ये नाही${hint}.` });
    }
    if (user.ward !== FLOW_WARD) {
      dropUpload();
      return res.status(403).json({ message: `Energy Expenditure approval फक्त Head Office users करू शकतात. तुमचा ward: ${user.ward || "-"}` });
    }

    const step = ENERGY_FLOW[stepIdx];
    const prevStep = stepIdx > 0 ? ENERGY_FLOW[stepIdx - 1] : null;
    const nextStep = ENERGY_FLOW[stepIdx + 1] || null;
    const isRequired = REQUIRED_FORM_TYPES.includes(formType);

    if (remark === "Approved" && isRequired && !isSignatureImage(signature)) {
      dropUpload();
      return res.status(400).json({ message: "Approve करण्यासाठी सही (signature image) upload करा.", code: "SIGNATURE_REQUIRED" });
    }

    let report = await Report.findOne({ seleMonth, ward: reportWard, flow: "HO" });
    if (!report) {
      if (stepIdx !== 0) {
        dropUpload();
        return res.status(400).json({ message: `${reportLabel} - ${seleMonth}: Clerk (Electrical) ने अजून reports upload केलेले नाहीत.` });
      }
      report = new Report({ seleMonth, ward: reportWard, monthReport: seleMonth, flow: "HO", reportingRemarks: [] });
    }

    // Documents नेहमी Clerk (Electrical) च्या remark मध्ये असतात
    let owner = report.reportingRemarks.find((r) => r.roleKey === "CLERK_E");
    if (!owner && stepIdx === 0) {
      report.reportingRemarks.push({
        userId: user._id, role: user.role, roleKey: step.key, department: user.department,
        remark, signature, ward: reportWard, userWard: user.ward, date: new Date(), documents: [],
      });
      owner = report.reportingRemarks[report.reportingRemarks.length - 1];
    }
    const docs = owner ? owner.documents : [];
    let doc = docs.find((d) => d.formType === formType);

    if (stepIdx === 0) {
      // ---------- Clerk (Electrical): upload / replace ----------
      const laterApproved = doc && ENERGY_FLOW.slice(1).find((s) => isApproved(doc, s.key));
      if (req.file && remark !== "Approved") dropUpload(); // Reject वेळी नवीन PDF घेत नाही
      if (req.file && remark === "Approved") {
        if (laterApproved) {
          dropUpload();
          return res.status(409).json({ message: `${formLabel(formType)} ${laterApproved.label} ने approve केला आहे. आता बदलता येणार नाही.` });
        }
        const slots = parseSlots(req.body.signatureSlots);
        if (doc) {
          // नवीन PDF -> आधीच्या सर्व सह्या / निर्णय रद्द
          doc.pdfFile = req.file.path;
          doc.uploadedAt = new Date();
          doc.signatureSlots = slots;
          doc.signedRoles = [];
        //   doc.stepStatus = [];
        // } else {

                    doc.stepStatus = [];
          // 27-Oct-2026: टिपणीचे आधीचे Notings (शेरे) नवीन PDF मध्ये परत लावा
          if (formType === "karyalayintipani") {
            try { await reapplyNotings(doc); } catch (e) { console.warn("reapplyNotings:", e.message); }
          }
        } else {
          docs.push({
            formType,
            formNumber: await generateFormNumber(formType),
            pdfFile: req.file.path,
            uploadedAt: new Date(),
            signatureSlots: slots,
            signedRoles: [],
            stepStatus: [],
            approvedBy: [],
            doneBy: [],
          });
          doc = docs[docs.length - 1];
        }
      } else if (!doc) {
        return res.status(400).json({ message: `${formLabel(formType)} ची PDF मिळाली नाही.` });
      } else if (laterApproved) {
        return res.status(409).json({ message: `${formLabel(formType)} ${laterApproved.label} ने approve केला आहे. आता बदलता येणार नाही.` });
      }
    } else {
      // ---------- बाकी steps ----------
      dropUpload(); // PDF फक्त Clerk (Electrical) upload करतो
      if (!doc) {
        return res.status(400).json({ message: `Clerk (Electrical) ने ${formLabel(formType)} अजून upload केलेला नाही.` });
      }
      if (remark === "Approved" && isRequired) {
        const pending = REQUIRED_FORM_TYPES.filter((t) => !isApproved(docs.find((d) => d.formType === t), prevStep.key));
        if (pending.length) {
          return res.status(400).json({
            message: `${prevStep.label} ने आधी सर्व forms approve करायला हवेत. बाकी: ${pending.map(formLabel).join(", ")}`,
          });
        }
      } else if (!isApproved(doc, prevStep.key)) {
        return res.status(400).json({ message: `${prevStep.label} ने ${formLabel(formType)} अजून approve केलेला नाही.` });
      }
      if (nextStep && isApproved(doc, nextStep.key)) {
        return res.status(409).json({ message: `${nextStep.label} ने ${formLabel(formType)} approve केला आहे. आता निर्णय बदलता येणार नाही.` });
      }
    }

    // ---------- निर्णय नोंदवा ----------
    // setStatus(doc, step, remark === "Send Back" ? "Returned" : remark, user._id);
        // setStatus(doc, step, remark === "Send Back" ? "Returned" : remark, user._id, isReturn ? reason : undefined); // 24-Oct-2026: reason
   
       setStatus(doc, step, remark === "Send Back" ? "Returned" : remark, user._id, isReturn ? reason : undefined, remark === "Approved" ? description : undefined); // 24-Oct-2026: reason + description + count
   
        if (isReturn && prevStep) {
      // ↕ मागच्या step कडे परत
      setStatus(doc, prevStep, "SentBack");
    }
    if (remark === "Approved" && isRequired) {
    //   await applySignatureForKey(doc, step.key, { userId: user._id, signature, signerName: user.username || "" });
    // }


          await applySignatureForKey(doc, step.key, { userId: user._id, signature, signerName: user.username || "" });
    }
    // 27-Oct-2026: कार्यालयीन टिपणी -> eOffice प्रमाणे "Note # n" : शेरा + सही + नाव + पद + दिनांक
    if (formType === "karyalayintipani") {
      doc.notings = doc.notings || [];
      const note = {
        noteNo: doc.notings.length + 1,
        roleKey: step.key,
        role: step.label,
        userId: user._id,
        userName: user.username || "",
        status: remark,
        text: isReturn ? reason : description,
        image: isNoteImage(req.body.noteImage) ? saveNoteImage(req.body.noteImage, doc.formNumber, step.key) : null,
        date: new Date(),
      };
      doc.notings.push(note);
      if (note.image) {
        try { await appendNoting(doc, note); } catch (e) { console.warn("appendNoting:", e.message); }
      }
    }
    doc.lastUpdated = new Date();
    syncLegacyFields(doc, reportWard);

    // या step चा remark (एक step = एक entry)
    const entry = report.reportingRemarks.find((r) => r.roleKey === step.key);
    if (entry) {
      entry.userId = user._id;
      entry.role = user.role;
      entry.department = user.department;
      entry.remark = remark;
      if (signature) entry.signature = signature;
      entry.userWard = user.ward;
      entry.ward = reportWard;
    //   entry.date = new Date();
    // } else {
    //   report.reportingRemarks.push({
    //     userId: user._id, role: user.role, roleKey: step.key, department: user.department,
    //     remark, signature, ward: reportWard, userWard: user.ward, date: new Date(), documents: [],
    //   });
    // }

          entry.date = new Date();
      // if (isReturn && reason) entry.reason = reason; // 24-Oct-2026
      if (isReturn && reason) entry.reason = reason; // 24-Oct-2026
      if (remark === "Approved" && description) entry.description = description; // 24-Oct-2026

    } else {
      report.reportingRemarks.push({
        userId: user._id, role: user.role, roleKey: step.key, department: user.department,
        remark, signature, ward: reportWard, userWard: user.ward, date: new Date(), documents: [],
        // ...(isReturn && reason ? { reason } : {}), // 24-Oct-2026


                ...(isReturn && reason ? { reason } : {}), // 24-Oct-2026
        ...(remark === "Approved" && description ? { description } : {}), // 24-Oct-2026
      });
    }

    // वापरलेली सही पुढच्या वेळेसाठी user वर
    if (remark === "Approved" && isSignatureImage(signature) && user.signature !== signature) {
      await User.updateOne({ _id: user._id }, { $set: { signature } });
    }

    report.markModified("reportingRemarks");
    await report.save();

    const msg =
      remark === "Approved"
        ? `${formLabel(formType)} approved${nextStep ? ` → ${nextStep.label}` : " (flow पूर्ण)"}`
        : `${formLabel(formType)} ${remark === "Send Back" ? "sent back" : "rejected"}${prevStep ? ` → परत ${prevStep.label} कडे` : ""}`;
    return res.status(201).json({ message: msg, report });
  } catch (error) {
    console.error("🚨 addRemarkReportsHO error:", error);
    dropUpload();
    if (error.code === "SIGNATURE_REQUIRED" || String(error.code || "").startsWith("DSC_")) {
      return res.status(error.status || 400).json({ message: error.message, code: error.code });
    }
    return res.status(500).json({ message: "Error while saving report.", error: error.message });
//   }
// };


  }
};

// =====================================================================
// 27-Oct-2026: Energy Expenditure — mailbox (Gmail / eOffice) सारखी files ची यादी
// प्रत्येक file = एक HO report (महिना + ward). सह्या / images पाठवत नाही (हलके).
// =====================================================================
exports.getEnergyInbox = async (req, res) => {
  try {
    const reports = await Report.find({ flow: "HO" })
      .select([
        "seleMonth", "ward", "flow", "createdAt", "updatedAt",
        "reportingRemarks.roleKey",
        "reportingRemarks.documents.formType",
        "reportingRemarks.documents.formNumber",
        "reportingRemarks.documents.uploadedAt",
        "reportingRemarks.documents.lastUpdated",
        "reportingRemarks.documents.pdfFile",
        "reportingRemarks.documents.stepStatus",
        "reportingRemarks.documents.decisionHistory",
        "reportingRemarks.documents.notings.noteNo",
      ].join(" "))
      .sort({ updatedAt: -1 })
      .lean();

    // शेवटचा निर्णय कोणी घेतला (Gmail मधील "From")
    const ids = new Set();
    reports.forEach((r) => (r.reportingRemarks || []).forEach((e) => (e.documents || []).forEach((d) =>
      (d.decisionHistory || []).forEach((h) => h.userId && ids.add(String(h.userId))))));
    const users = ids.size ? await User.find({ _id: { $in: [...ids] } }).select("username").lean() : [];
    const nameOf = Object.fromEntries(users.map((u) => [String(u._id), u.username || ""]));

    const files = reports.map((r) => {
      const owner = (r.reportingRemarks || []).find((e) => e.roleKey === "CLERK_E");
      const docs = (owner?.documents || []).filter((d) => REQUIRED_FORM_TYPES.includes(d.formType));
      const forms = docs.map((d) => {
        const st = d.stepStatus || [];
        const statusOfKey = (k) => (st.find((s) => s.roleKey === k) || {}).status || null;
        // file सध्या कोणाकडे: पहिला step जो अजून Approved नाही
        const pending = ENERGY_FLOW.find((s) => statusOfKey(s.key) !== "Approved");
        return {
          formType: d.formType,
          formNumber: d.formNumber,
          pdfFile: d.pdfFile,
          uploadedAt: d.uploadedAt,
          lastUpdated: d.lastUpdated || d.uploadedAt,
          currentKey: pending ? pending.key : null,       // null = सर्वांनी approve केले
          currentLabel: pending ? pending.label : "Completed",
          steps: st.map((s) => ({ roleKey: s.roleKey, status: s.status, date: s.date })),
          notings: (d.notings || []).length,
        };
      });

      let last = null;
      docs.forEach((d) => (d.decisionHistory || []).forEach((h) => {
        if (!last || new Date(h.date) > new Date(last.date)) last = h;
      }));

      const lastDate = [r.updatedAt, ...forms.map((f) => f.lastUpdated)].filter(Boolean)
        .reduce((a, b) => (new Date(b) > new Date(a) ? b : a), r.createdAt);

      return {
        _id: r._id,
        seleMonth: r.seleMonth,
        ward: r.ward,
        createdAt: r.createdAt,
        updatedAt: lastDate,
        forms,
        lastAction: last
          ? { roleKey: last.roleKey, role: last.role, status: last.status, date: last.date, userName: nameOf[String(last.userId)] || "" }
          : null,
      };
    });

    return res.status(200).json(files);
  } catch (error) {
    console.error("🚨 getEnergyInbox error:", error);
    return res.status(500).json({ message: "Error while loading files.", error: error.message });
  }
};