const Report = require('../models/report');
const mongoose = require("mongoose");
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');
const PDFLib = require('pdf-lib');

const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});


const upload = multer({ storage: storage }).array('pdfFiles', 5); 

const generateFormNumber = async (formType) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0'); 

    const count = await Report.countDocuments() + 1;

    return `${formType}-${year}${month}${day}-${count}`;
};


exports.getReports = async (req, res) => {
    try {
      const reports = await Report.find();
      res.status(200).json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };



  const saveBase64File = (base64String, formNumber) => {
    try {
        console.log("🟢 Saving PDF for Form Number:", formNumber);

        if (!base64String.startsWith("data:application/pdf;base64,")) {
            throw new Error("Invalid PDF Base64 format");
        }

        const base64Data = base64String.replace(/^data:application\/pdf;base64,/, "");
        const pdfBuffer = Buffer.from(base64Data, "base64");
        const filePath = path.join(__dirname, "../uploads", `${formNumber}.pdf`);

        fs.writeFileSync(filePath, pdfBuffer);
        console.log("✅ PDF Saved at:", filePath);

        return `/uploads/${formNumber}.pdf`;
    } catch (error) {
        console.error("❌ Error saving PDF:", error);
        return null;
    }
};




// -----------------------------------------------------------------------


// Helper: Required forms
const REQUIRED_FORM_TYPES = ['wardbilllist', 'form22', 'karyalayintipani'];

// Helper: Check if all required forms are approved by a specific role
const areAllFormsApprovedByRole = (report, role, ward) => {
  const roleRemark = report.reportingRemarks.find(r => 
    r.role === role && (r.ward === ward || r.userWard === ward) && r.remark === "Approved"
  );
  if (!roleRemark) return false;

  if (role === "Lipik") {
    const approvedFormTypes = roleRemark.documents.map(doc => doc.formType);
    return REQUIRED_FORM_TYPES.every(type => approvedFormTypes.includes(type));
  }

  const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
  if (!lipikRemark || !lipikRemark.documents?.length) return false;

  return REQUIRED_FORM_TYPES.every(type => {
    const doc = lipikRemark.documents.find(d => d.formType === type);
    return doc && doc.approvedBy?.includes(roleRemark.userId.toString());
  });
};

// Helper: Get missing form types
const getMissingFormTypes = (report, role, ward, userId) => {
  if (role === "Lipik") {
    const lipikRemark = report.reportingRemarks.find(r => r.role === role && (r.ward === ward || r.userWard === ward));
    const approvedTypes = lipikRemark?.documents?.map(doc => doc.formType) || [];
    return REQUIRED_FORM_TYPES.filter(type => !approvedTypes.includes(type));
  } else {
    const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
    if (!lipikRemark || !lipikRemark.documents) return REQUIRED_FORM_TYPES;

    return REQUIRED_FORM_TYPES.filter(type => {
      const doc = lipikRemark.documents.find(d => d.formType === type);
      return !doc?.approvedBy?.includes(userId);
    });
  }
};

// Helper: Populate doneBy array
const populateDoneByArray = (document, reportingRemarks, ward) => {
  const doneBy = [];
  document.approvedBy?.forEach(userId => {
    const userRemark = reportingRemarks.find(r => r.userId.toString() === userId.toString() && r.remark === "Approved");
    if (userRemark) {
      doneBy.push({
        formType: document.formType,
        userId,
        role: userRemark.role,
        status: 'verified',
        ward,
        userWard: userRemark.userWard || userRemark.ward
      });
    }
  });
  return doneBy;
};

// Helper: Update document doneBy
const updateDocumentDoneBy = (document, reportingRemarks, ward) => {
  document.doneBy = populateDoneByArray(document, reportingRemarks, ward);
  return document;
};

// Main controller
// exports.addRemarkReports = async (req, res) => {
//   try {
//     const { userId, remark, role, signature, ward, formType, pdfData, seleMonth, wardName, mode } = req.body;
//     const userWard = ward;
//     const missingFields = [];
//     if (!role) missingFields.push("role");
//     if (!remark) missingFields.push("remark");
//     if (!formType) missingFields.push("formType");
//     if (!seleMonth) missingFields.push("seleMonth");
//     if (!ward) missingFields.push("ward");

//     if (missingFields.length) return res.status(400).json({ message: `Missing: ${missingFields.join(", ")}` });

//     const formNumber = await generateFormNumber(formType);
//     let document = null;

//     if (req.file) {
//       document = { formType, formNumber, pdfFile: req.file.path, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
//     } else if (pdfData) {
//       const pdfFilePath = saveBase64File(pdfData, formNumber);
//       if (!pdfFilePath) return res.status(400).json({ message: "Invalid base64 PDF." });
//       document = { formType, formNumber, pdfFile: pdfFilePath, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
//     } else {
//       return res.status(400).json({ message: "PDF file or base64 required." });
//     }

//     let report;

//     if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//       report = await Report.findOne({ seleMonth, ward: wardName });
//       if (!report) return res.status(400).json({ message: "Ward report not found." });

//       const approved = areAllFormsApprovedByRole(report, "Junior Engineer", wardName);
//       if (!approved) {
//         const missing = getMissingFormTypes(report, "Junior Engineer", wardName, userId);
//         return res.status(400).json({ message: `Ward JE must approve all forms. Missing: ${missing.join(", ")}` });
//       }

//       const jeRemark = {
//         userId: new mongoose.Types.ObjectId(userId),
//         role: "Junior Engineer",
//         ward: "Head Office",
//         userWard: "Head Office",
//         remark,
//         signature,
//         date: new Date()
//       };

//       const exists = report.reportingRemarks.some(r => r.userId.toString() === userId && r.role === "Junior Engineer" && (r.ward === "Head Office" || r.userWard === "Head Office"));

//       if (!exists) {
//         if (remark === "Approved") {
//           const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//           lipik?.documents?.forEach(doc => {
//             if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//             doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, jeRemark], wardName);
//           });
//         }
//         report.reportingRemarks.push(jeRemark);
//         await report.save();
//       }
//       return res.status(201).json({ message: "Head Office JE remark added.", report });
//     }

//     report = await Report.findOne({ seleMonth, ward });
//     if (!report) report = new Report({ seleMonth, ward, monthReport: seleMonth, reportingRemarks: [] });

//     if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//       return res.status(400).json({ message: "First remark must be from Lipik." });
//     }

//     // Hierarchy checks
//     if (role !== "Lipik") {
//       const checks = {
//         "Junior Engineer": "Lipik",
//         "Accountant": "Junior Engineer",
//         "Assistant Municipal Commissioner": "Accountant",
//         "Dy.Municipal Commissioner": "Assistant Municipal Commissioner"
//       };
//       const checkRole = checks[role];
//       if (checkRole) {
//         const approved = checkRole === "Junior Engineer" && role === "Accountant"
//           ? areAllFormsApprovedByRole(report, checkRole, ward) && areAllFormsApprovedByRole(report, checkRole, "Head Office")
//           : areAllFormsApprovedByRole(report, checkRole, ward);

//         if (!approved) {
//           const missing = getMissingFormTypes(report, checkRole, checkRole === "Junior Engineer" ? [ward, "Head Office"].find(w => !areAllFormsApprovedByRole(report, checkRole, w)) : ward, userId);
//           return res.status(400).json({ message: `${checkRole} must approve all forms. Missing: ${missing.join(", ")}` });
//         }
//       }
//     }

//     const index = report.reportingRemarks.findIndex(r => r.userId.toString() === userId && r.role === role && (r.ward === ward || r.userWard === ward));

//     if (index !== -1) {
//       const existing = report.reportingRemarks[index];
//       existing.remark = remark;
//       existing.signature = signature;
//       existing.date = new Date();

//       if (role === "Lipik") {
//         const docs = existing.documents || [];
//         const docIndex = docs.findIndex(d => d.formType === formType);

//         if (docIndex !== -1) {
//           const doc = docs[docIndex];
//           doc.uploadedAt = new Date();
//           doc.pdfFile = document.pdfFile;
//           doc.approvedBy = remark === "Approved" ? [userId] : doc.approvedBy;
//           doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
//         } else {
//           const newDoc = { ...document, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
//           newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
//           docs.push(newDoc);
//         }
//         existing.documents = docs;
//       }

//       if (remark === "Approved") {
//         const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//         lipik?.documents?.forEach(doc => {
//           if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//           doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
//         });
//       }

//       report.reportingRemarks[index] = existing;
//     } else {
//       const remarkObj = {
//         userId: new mongoose.Types.ObjectId(userId),
//         ward,
//         role,
//         remark,
//         signature,
//         userWard,
//         date: new Date(),
//         documents: []
//       };

//       if (role === "Lipik" && remark === "Approved") {
//         document.approvedBy.push(userId);
//         document.doneBy = populateDoneByArray(document, [remarkObj], ward);
//         remarkObj.documents.push(document);
//       } else if (role !== "Lipik") {
//         const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (!lipik) return res.status(400).json({ message: "Lipik remark not found." });

//         const docIndex = lipik.documents.findIndex(d => d.formType === formType);

//         if (docIndex !== -1) {
//           const doc = lipik.documents[docIndex];
//           if (!doc.signatures) doc.signatures = {};
//           doc.signatures[role] = signature;
//           if (remark === "Approved" && !doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//           doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, remarkObj], ward);
//         } else {
//           const newDoc = { ...document, signatures: { [role]: signature }, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
//           newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
//           lipik.documents.push(newDoc);
//         }
//       }

//       report.reportingRemarks.push(remarkObj);
//     }

//     const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//     lipik?.documents?.forEach(doc => doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward));
//     await report.save();

//     res.status(201).json({ message: "Report saved.", report });
//   } catch (error) {
//     console.error("🚨 Error:", error);
//     res.status(500).json({ message: "Error while saving report.", error: error.message });
//   }
// };
// ==========================================================

// // Main controller
// exports.addRemarkReports = async (req, res) => {
//   try {
//     const { userId, remark, role, signature, ward, formType, pdfData, seleMonth, wardName, mode } = req.body;
//     const userWard = ward;
//     const missingFields = [];
//     if (!role) missingFields.push("role");
//     if (!remark) missingFields.push("remark");
//     if (!formType) missingFields.push("formType");
//     if (!seleMonth) missingFields.push("seleMonth");
//     if (!ward) missingFields.push("ward");

//     if (missingFields.length) return res.status(400).json({ message: `Missing: ${missingFields.join(", ")}` });

//     const formNumber = await generateFormNumber(formType);
//     let document = null;

//     if (req.file) {
//       document = { formType, formNumber, pdfFile: req.file.path, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
//     } else if (pdfData) {
//       const pdfFilePath = saveBase64File(pdfData, formNumber);
//       if (!pdfFilePath) return res.status(400).json({ message: "Invalid base64 PDF." });
//       document = { formType, formNumber, pdfFile: pdfFilePath, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
//     } else {
//       return res.status(400).json({ message: "PDF file or base64 required." });
//     }

//     // PDF Update Function - Inline
//     const updatePdfWithAllSignatures = async (pdfPath, approvalData, formNum) => {
//       try {
//         const existingPdfBytes = fs.readFileSync(pdfPath);
//         const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
//         const pages = pdfDoc.getPages();
//         const firstPage = pages[0];
//         const { width, height } = firstPage.getSize();

//         // Define signature positions
//         const signaturePositions = {
//           'Lipik': { x: 50, y: height - 150 },
//           'Junior Engineer': { x: 200, y: height - 150 },
//           'Accountant': { x: 350, y: height - 150 },
//           'Assistant Municipal Commissioner': { x: 50, y: height - 250 },
//           'Dy.Municipal Commissioner': { x: 200, y: height - 250 }
//         };

//         // Add signatures for each approved role
//         for (const approval of approvalData) {
//           if (approval.signature && signaturePositions[approval.role]) {
//             const position = signaturePositions[approval.role];

//             // Add role label
//             firstPage.drawText(`${approval.role}:`, {
//               x: position.x,
//               y: position.y + 30,
//               size: 10,
//               color: PDFLib.rgb(0, 0, 0)
//             });

//             // Add status
//             firstPage.drawText(`Status: ${approval.status || 'verified'}`, {
//               x: position.x,
//               y: position.y + 15,
//               size: 8,
//               color: PDFLib.rgb(0, 0.5, 0)
//             });

//             // Add date
//             firstPage.drawText(`Date: ${new Date(approval.date).toLocaleDateString()}`, {
//               x: position.x,
//               y: position.y,
//               size: 8,
//               color: PDFLib.rgb(0, 0, 0)
//             });

//             // Add signature image if available
//             if (approval.signature && approval.signature.startsWith('data:image')) {
//               try {
//                 const signatureBase64 = approval.signature.split(',')[1];
//                 const signatureBytes = Buffer.from(signatureBase64, 'base64');

//                 let embeddedImage;
//                 if (approval.signature.includes('png')) {
//                   embeddedImage = await pdfDoc.embedPng(signatureBytes);
//                 } else if (approval.signature.includes('jpg') || approval.signature.includes('jpeg')) {
//                   embeddedImage = await pdfDoc.embedJpg(signatureBytes);
//                 }

//                 if (embeddedImage) {
//                   firstPage.drawImage(embeddedImage, {
//                     x: position.x,
//                     y: position.y - 40,
//                     width: 80,
//                     height: 30
//                   });
//                 }
//               } catch (imageError) {
//                 firstPage.drawText('Signature Applied', {
//                   x: position.x,
//                   y: position.y - 20,
//                   size: 8,
//                   color: PDFLib.rgb(0, 0, 0.8)
//                 });
//               }
//             } else {
//               firstPage.drawText('Signature Applied', {
//                 x: position.x,
//                 y: position.y - 20,
//                 size: 8,
//                 color: PDFLib.rgb(0, 0, 0.8)
//               });
//             }
//           }
//         }

//         const pdfBytes = await pdfDoc.save();
//         const updatedPdfPath = path.join(path.dirname(pdfPath), `updated_${formNum}_${Date.now()}.pdf`);
//         fs.writeFileSync(updatedPdfPath, pdfBytes);
//         return updatedPdfPath;
//       } catch (error) {
//         console.error('Error updating PDF:', error);
//         throw error;
//       }
//     };

//     // Create approval data from reporting remarks
//     const createApprovalData = (reportingRemarks, targetWard) => {
//       return reportingRemarks
//         .filter(remark => remark.ward === targetWard || remark.userWard === targetWard)
//         .map(remark => ({
//           role: remark.role,
//           remark: remark.remark,
//           signature: remark.signature,
//           date: remark.date,
//           status: remark.remark === 'Approved' ? 'verified' : 'pending',
//           ward: remark.ward || remark.userWard
//         }))
//         .sort((a, b) => {
//           const hierarchy = ['Lipik', 'Junior Engineer', 'Accountant', 'Assistant Municipal Commissioner', 'Dy.Municipal Commissioner'];
//           return hierarchy.indexOf(a.role) - hierarchy.indexOf(b.role);
//         });
//     };

//     let report;

//     if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//       report = await Report.findOne({ seleMonth, ward: wardName });
//       if (!report) return res.status(400).json({ message: "Ward report not found." });

//       const approved = areAllFormsApprovedByRole(report, "Junior Engineer", wardName);
//       if (!approved) {
//         const missing = getMissingFormTypes(report, "Junior Engineer", wardName, userId);
//         return res.status(400).json({ message: `Ward JE must approve all forms. Missing: ${missing.join(", ")}` });
//       }

//       const jeRemark = {
//         userId: new mongoose.Types.ObjectId(userId),
//         role: "Junior Engineer",
//         ward: "Head Office",
//         userWard: "Head Office",
//         remark,
//         signature,
//         date: new Date()
//       };

//       const exists = report.reportingRemarks.some(r => r.userId.toString() === userId && r.role === "Junior Engineer" && (r.ward === "Head Office" || r.userWard === "Head Office"));

//       if (!exists) {
//         if (remark === "Approved") {
//           const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//           if (lipik?.documents) {
//             for (let doc of lipik.documents) {
//               if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//               doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, jeRemark], wardName);
              
//               // Update PDF with Head Office JE signature
//               try {
//                 const approvalData = createApprovalData([...report.reportingRemarks, jeRemark], wardName);
//                 const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//                 doc.pdfFile = updatedPdfPath;
//                 doc.lastUpdated = new Date();
//               } catch (pdfError) {
//                 console.error('Error updating PDF for Head Office JE:', pdfError);
//               }
//             }
//           }
//         }
//         report.reportingRemarks.push(jeRemark);
//         await report.save();
//       }
//       return res.status(201).json({ message: "Head Office JE remark added.", report });
//     }

//     report = await Report.findOne({ seleMonth, ward });
//     if (!report) report = new Report({ seleMonth, ward, monthReport: seleMonth, reportingRemarks: [] });

//     if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//       return res.status(400).json({ message: "First remark must be from Lipik." });
//     }

//     // Hierarchy checks
//     if (role !== "Lipik") {
//       const checks = {
//         "Junior Engineer": "Lipik",
//         "Accountant": "Junior Engineer",
//         "Assistant Municipal Commissioner": "Accountant",
//         "Dy.Municipal Commissioner": "Assistant Municipal Commissioner"
//       };
//       const checkRole = checks[role];
//       if (checkRole) {
//         const approved = checkRole === "Junior Engineer" && role === "Accountant"
//           ? areAllFormsApprovedByRole(report, checkRole, ward) && areAllFormsApprovedByRole(report, checkRole, "Head Office")
//           : areAllFormsApprovedByRole(report, checkRole, ward);

//         if (!approved) {
//           const missing = getMissingFormTypes(report, checkRole, checkRole === "Junior Engineer" ? [ward, "Head Office"].find(w => !areAllFormsApprovedByRole(report, checkRole, w)) : ward, userId);
//           return res.status(400).json({ message: `${checkRole} must approve all forms. Missing: ${missing.join(", ")}` });
//         }
//       }
//     }

//     const index = report.reportingRemarks.findIndex(r => r.userId.toString() === userId && r.role === role && (r.ward === ward || r.userWard === ward));

//     if (index !== -1) {
//       const existing = report.reportingRemarks[index];
//       existing.remark = remark;
//       existing.signature = signature;
//       existing.date = new Date();

//       if (role === "Lipik") {
//         const docs = existing.documents || [];
//         const docIndex = docs.findIndex(d => d.formType === formType);

//         if (docIndex !== -1) {
//           const doc = docs[docIndex];
//           doc.uploadedAt = new Date();
//           doc.pdfFile = document.pdfFile;
//           doc.approvedBy = remark === "Approved" ? [userId] : doc.approvedBy;
//           doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
          
//           // Update PDF with Lipik signature for updated document
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData(report.reportingRemarks, ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//               doc.pdfFile = updatedPdfPath;
//               doc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error('Error updating PDF for Lipik update:', pdfError);
//             }
//           }
//         } else {
//           const newDoc = { ...document, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
//           newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
          
//           // Update PDF with Lipik signature for new document
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData(report.reportingRemarks, ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(newDoc.pdfFile, approvalData, newDoc.formNumber);
//               newDoc.pdfFile = updatedPdfPath;
//               newDoc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error('Error updating PDF for Lipik new:', pdfError);
//             }
//           }
          
//           docs.push(newDoc);
//         }
//         existing.documents = docs;
//       }

//       // Update PDF for all approved roles
//       if (remark === "Approved") {
//         const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (lipik?.documents) {
//           for (let doc of lipik.documents) {
//             if (role === "Lipik" || doc.formType === formType) {
//               if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//               doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
              
//               // Update PDF with current role signature
//               try {
//                 const approvalData = createApprovalData(report.reportingRemarks, ward);
//                 const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//                 doc.pdfFile = updatedPdfPath;
//                 doc.lastUpdated = new Date();
//               } catch (pdfError) {
//                 console.error(`Error updating PDF for ${role}:`, pdfError);
//               }
//             }
//           }
//         }
//       }

//       report.reportingRemarks[index] = existing;
//     } else {
//       const remarkObj = {
//         userId: new mongoose.Types.ObjectId(userId),
//         ward,
//         role,
//         remark,
//         signature,
//         userWard,
//         date: new Date(),
//         documents: []
//       };

//       if (role === "Lipik" && remark === "Approved") {
//         document.approvedBy.push(userId);
//         document.doneBy = populateDoneByArray(document, [remarkObj], ward);
        
//         // Update PDF with initial Lipik signature
//         try {
//           const approvalData = createApprovalData([remarkObj], ward);
//           const updatedPdfPath = await updatePdfWithAllSignatures(document.pdfFile, approvalData, document.formNumber);
//           document.pdfFile = updatedPdfPath;
//           document.lastUpdated = new Date();
//         } catch (pdfError) {
//           console.error('Error updating PDF for initial Lipik:', pdfError);
//         }
        
//         remarkObj.documents.push(document);
//       } else if (role !== "Lipik") {
//         const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (!lipik) return res.status(400).json({ message: "Lipik remark not found." });

//         const docIndex = lipik.documents.findIndex(d => d.formType === formType);

//         if (docIndex !== -1) {
//           const doc = lipik.documents[docIndex];
//           if (!doc.signatures) doc.signatures = {};
//           doc.signatures[role] = signature;
//           if (remark === "Approved" && !doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//           doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, remarkObj], ward);
          
//           // Update PDF with new role signature
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData([...report.reportingRemarks, remarkObj], ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//               doc.pdfFile = updatedPdfPath;
//               doc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error(`Error updating PDF for ${role}:`, pdfError);
//             }
//           }
//         } else {
//           const newDoc = { ...document, signatures: { [role]: signature }, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
//           newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
          
//           // Update PDF for new document with non-Lipik role
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData([...report.reportingRemarks, remarkObj], ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(newDoc.pdfFile, approvalData, newDoc.formNumber);
//               newDoc.pdfFile = updatedPdfPath;
//               newDoc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error(`Error updating PDF for ${role} new doc:`, pdfError);
//             }
//           }
          
//           lipik.documents.push(newDoc);
//         }
//       }

//       report.reportingRemarks.push(remarkObj);
//     }

//     const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//     lipik?.documents?.forEach(doc => doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward));
//     await report.save();

//     res.status(201).json({ message: "Report saved.", report });
//   } catch (error) {
//     console.error("🚨 Error:", error);
//     res.status(500).json({ message: "Error while saving report.", error: error.message });
//   }
// };

// =======================================================


// // Main controller
// exports.addRemarkReports = async (req, res) => {
//   try {
//     const { userId, remark, role, signature, ward, formType, pdfData, seleMonth, wardName, mode } = req.body;
//     const userWard = ward;
//     const missingFields = [];
//     if (!role) missingFields.push("role");
//     if (!remark) missingFields.push("remark");
//     if (!formType) missingFields.push("formType");
//     if (!seleMonth) missingFields.push("seleMonth");
//     if (!ward) missingFields.push("ward");

//     if (missingFields.length) return res.status(400).json({ message: `Missing: ${missingFields.join(", ")}` });

//     const formNumber = await generateFormNumber(formType);
//     let document = null;

//     if (req.file) {
//       document = { formType, formNumber, pdfFile: req.file.path, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
//     } else if (pdfData) {
//       const pdfFilePath = saveBase64File(pdfData, formNumber);
//       if (!pdfFilePath) return res.status(400).json({ message: "Invalid base64 PDF." });
//       document = { formType, formNumber, pdfFile: pdfFilePath, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
//     } else {
//       return res.status(400).json({ message: "PDF file or base64 required." });
//     }

//     // PDF Update Function - Inline
//     const updatePdfWithAllSignatures = async (pdfPath, approvalData, formNum) => {
//       try {
//         const existingPdfBytes = fs.readFileSync(pdfPath);
//         const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
//         const pages = pdfDoc.getPages();
//         const firstPage = pages[0];
//         const { width, height } = firstPage.getSize();

//         // Define signature positions
//         const signaturePositions = {
//           'Lipik': { x: 50, y: height - 150 },
//           'Junior Engineer': { x: 200, y: height - 150 },
//           'Accountant': { x: 350, y: height - 150 },
//           'Assistant Municipal Commissioner': { x: 50, y: height - 250 },
//           'Dy.Municipal Commissioner': { x: 200, y: height - 250 }
//         };

//         // Add signatures for each approved role
//         for (const approval of approvalData) {
//           if (approval.signature && signaturePositions[approval.role]) {
//             const position = signaturePositions[approval.role];

//             // Add role label
//             firstPage.drawText(`${approval.role}:`, {
//               x: position.x,
//               y: position.y + 30,
//               size: 10,
//               color: PDFLib.rgb(0, 0, 0)
//             });

//             // Add status
//             firstPage.drawText(`Status: ${approval.status || 'verified'}`, {
//               x: position.x,
//               y: position.y + 15,
//               size: 8,
//               color: PDFLib.rgb(0, 0.5, 0)
//             });

//             // Add date
//             firstPage.drawText(`Date: ${new Date(approval.date).toLocaleDateString()}`, {
//               x: position.x,
//               y: position.y,
//               size: 8,
//               color: PDFLib.rgb(0, 0, 0)
//             });

//             // Add signature image if available
//             if (approval.signature && approval.signature.startsWith('data:image')) {
//               try {
//                 const signatureBase64 = approval.signature.split(',')[1];
//                 const signatureBytes = Buffer.from(signatureBase64, 'base64');

//                 let embeddedImage;
//                 if (approval.signature.includes('png')) {
//                   embeddedImage = await pdfDoc.embedPng(signatureBytes);
//                 } else if (approval.signature.includes('jpg') || approval.signature.includes('jpeg')) {
//                   embeddedImage = await pdfDoc.embedJpg(signatureBytes);
//                 }

//                 if (embeddedImage) {
//                   firstPage.drawImage(embeddedImage, {
//                     x: position.x,
//                     y: position.y - 40,
//                     width: 80,
//                     height: 30
//                   });
//                 }
//               } catch (imageError) {
//                 firstPage.drawText('Signature Applied', {
//                   x: position.x,
//                   y: position.y - 20,
//                   size: 8,
//                   color: PDFLib.rgb(0, 0, 0.8)
//                 });
//               }
//             } else {
//               firstPage.drawText('Signature Applied', {
//                 x: position.x,
//                 y: position.y - 20,
//                 size: 8,
//                 color: PDFLib.rgb(0, 0, 0.8)
//               });
//             }
//           }
//         }

//         const pdfBytes = await pdfDoc.save();
//         const updatedPdfPath = path.join(path.dirname(pdfPath), `updated_${formNum}_${Date.now()}.pdf`);
//         fs.writeFileSync(updatedPdfPath, pdfBytes);
//         return updatedPdfPath;
//       } catch (error) {
//         console.error('Error updating PDF:', error);
//         throw error;
//       }
//     };

//     // Create approval data from reporting remarks - FIXED TO INCLUDE HEAD OFFICE JE
//     const createApprovalData = (reportingRemarks, targetWard) => {
//       return reportingRemarks
//         .filter(remark => {
//           // Include remarks for the target ward OR Head Office Junior Engineers
//           return remark.ward === targetWard || 
//                  remark.userWard === targetWard || 
//                  (remark.role === "Junior Engineer" && remark.userWard === "Head Office");
//         })
//         .map(remark => ({
//           role: remark.role,
//           remark: remark.remark,
//           signature: remark.signature,
//           date: remark.date,
//           status: remark.remark === 'Approved' ? 'verified' : 'pending',
//           ward: remark.ward || remark.userWard
//         }))
//         .sort((a, b) => {
//           const hierarchy = ['Lipik', 'Junior Engineer', 'Accountant', 'Assistant Municipal Commissioner', 'Dy.Municipal Commissioner'];
//           return hierarchy.indexOf(a.role) - hierarchy.indexOf(b.role);
//         });
//     };

//     let report;

//     if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//       report = await Report.findOne({ seleMonth, ward: wardName });
//       if (!report) return res.status(400).json({ message: "Ward report not found." });

//       const approved = areAllFormsApprovedByRole(report, "Junior Engineer", wardName);
//       if (!approved) {
//         const missing = getMissingFormTypes(report, "Junior Engineer", wardName, userId);
//         return res.status(400).json({ message: `Ward JE must approve all forms. Missing: ${missing.join(", ")}` });
//       }

//       const jeRemark = {
//         userId: new mongoose.Types.ObjectId(userId),
//         role: "Junior Engineer",
//         ward: "Head Office",
//         userWard: "Head Office",
//         remark,
//         signature,
//         date: new Date()
//       };

//       const exists = report.reportingRemarks.some(r => r.userId.toString() === userId && r.role === "Junior Engineer" && (r.ward === "Head Office" || r.userWard === "Head Office"));

//       if (!exists) {
//         if (remark === "Approved") {
//           const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//           if (lipik?.documents) {
//             for (let doc of lipik.documents) {
//               if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//               doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, jeRemark], wardName);
              
//               // Update PDF with Head Office JE signature
//               try {
//                 const approvalData = createApprovalData([...report.reportingRemarks, jeRemark], wardName);
//                 const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//                 doc.pdfFile = updatedPdfPath;
//                 doc.lastUpdated = new Date();
//               } catch (pdfError) {
//                 console.error('Error updating PDF for Head Office JE:', pdfError);
//               }
//             }
//           }
//         }
//         report.reportingRemarks.push(jeRemark);
//         await report.save();
//       }
//       return res.status(201).json({ message: "Head Office JE remark added.", report });
//     }

//     report = await Report.findOne({ seleMonth, ward });
//     if (!report) report = new Report({ seleMonth, ward, monthReport: seleMonth, reportingRemarks: [] });

//     if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//       return res.status(400).json({ message: "First remark must be from Lipik." });
//     }

//     // Hierarchy checks
//     if (role !== "Lipik") {
//       const checks = {
//         "Junior Engineer": "Lipik",
//         "Accountant": "Junior Engineer",
//         "Assistant Municipal Commissioner": "Accountant",
//         "Dy.Municipal Commissioner": "Assistant Municipal Commissioner"
//       };
//       const checkRole = checks[role];
//       if (checkRole) {
//         const approved = checkRole === "Junior Engineer" && role === "Accountant"
//           ? areAllFormsApprovedByRole(report, checkRole, ward) && areAllFormsApprovedByRole(report, checkRole, "Head Office")
//           : areAllFormsApprovedByRole(report, checkRole, ward);

//         if (!approved) {
//           const missing = getMissingFormTypes(report, checkRole, checkRole === "Junior Engineer" ? [ward, "Head Office"].find(w => !areAllFormsApprovedByRole(report, checkRole, w)) : ward, userId);
//           return res.status(400).json({ message: `${checkRole} must approve all forms. Missing: ${missing.join(", ")}` });
//         }
//       }
//     }

//     const index = report.reportingRemarks.findIndex(r => r.userId.toString() === userId && r.role === role && (r.ward === ward || r.userWard === ward));

//     if (index !== -1) {
//       const existing = report.reportingRemarks[index];
//       existing.remark = remark;
//       existing.signature = signature;
//       existing.date = new Date();

//       if (role === "Lipik") {
//         const docs = existing.documents || [];
//         const docIndex = docs.findIndex(d => d.formType === formType);

//         if (docIndex !== -1) {
//           const doc = docs[docIndex];
//           doc.uploadedAt = new Date();
//           doc.pdfFile = document.pdfFile;
//           doc.approvedBy = remark === "Approved" ? [userId] : doc.approvedBy;
//           doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
          
//           // Update PDF with Lipik signature for updated document
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData(report.reportingRemarks, ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//               doc.pdfFile = updatedPdfPath;
//               doc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error('Error updating PDF for Lipik update:', pdfError);
//             }
//           }
//         } else {
//           const newDoc = { ...document, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
//           newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
          
//           // Update PDF with Lipik signature for new document
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData(report.reportingRemarks, ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(newDoc.pdfFile, approvalData, newDoc.formNumber);
//               newDoc.pdfFile = updatedPdfPath;
//               newDoc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error('Error updating PDF for Lipik new:', pdfError);
//             }
//           }
          
//           docs.push(newDoc);
//         }
//         existing.documents = docs;
//       }

//       // Update PDF for all approved roles
//       if (remark === "Approved") {
//         const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (lipik?.documents) {
//           for (let doc of lipik.documents) {
//             if (role === "Lipik" || doc.formType === formType) {
//               if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//               doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
              
//               // Update PDF with current role signature
//               try {
//                 const approvalData = createApprovalData(report.reportingRemarks, ward);
//                 const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//                 doc.pdfFile = updatedPdfPath;
//                 doc.lastUpdated = new Date();
//               } catch (pdfError) {
//                 console.error(`Error updating PDF for ${role}:`, pdfError);
//               }
//             }
//           }
//         }
//       }

//       report.reportingRemarks[index] = existing;
//     } else {
//       const remarkObj = {
//         userId: new mongoose.Types.ObjectId(userId),
//         ward,
//         role,
//         remark,
//         signature,
//         userWard,
//         date: new Date(),
//         documents: []
//       };

//       if (role === "Lipik" && remark === "Approved") {
//         document.approvedBy.push(userId);
//         document.doneBy = populateDoneByArray(document, [remarkObj], ward);
        
//         // Update PDF with initial Lipik signature
//         try {
//           const approvalData = createApprovalData([remarkObj], ward);
//           const updatedPdfPath = await updatePdfWithAllSignatures(document.pdfFile, approvalData, document.formNumber);
//           document.pdfFile = updatedPdfPath;
//           document.lastUpdated = new Date();
//         } catch (pdfError) {
//           console.error('Error updating PDF for initial Lipik:', pdfError);
//         }
        
//         remarkObj.documents.push(document);
//       } else if (role !== "Lipik") {
//         const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (!lipik) return res.status(400).json({ message: "Lipik remark not found." });

//         const docIndex = lipik.documents.findIndex(d => d.formType === formType);

//         if (docIndex !== -1) {
//           const doc = lipik.documents[docIndex];
//           if (!doc.signatures) doc.signatures = {};
//           doc.signatures[role] = signature;
//           if (remark === "Approved" && !doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
//           doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, remarkObj], ward);
          
//           // Update PDF with new role signature
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData([...report.reportingRemarks, remarkObj], ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
//               doc.pdfFile = updatedPdfPath;
//               doc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error(`Error updating PDF for ${role}:`, pdfError);
//             }
//           }
//         } else {
//           const newDoc = { ...document, signatures: { [role]: signature }, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
//           newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
          
//           // Update PDF for new document with non-Lipik role
//           if (remark === "Approved") {
//             try {
//               const approvalData = createApprovalData([...report.reportingRemarks, remarkObj], ward);
//               const updatedPdfPath = await updatePdfWithAllSignatures(newDoc.pdfFile, approvalData, newDoc.formNumber);
//               newDoc.pdfFile = updatedPdfPath;
//               newDoc.lastUpdated = new Date();
//             } catch (pdfError) {
//               console.error(`Error updating PDF for ${role} new doc:`, pdfError);
//             }
//           }
          
//           lipik.documents.push(newDoc);
//         }
//       }

//       report.reportingRemarks.push(remarkObj);
//     }

//     const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
//     lipik?.documents?.forEach(doc => doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward));
//     await report.save();

//     res.status(201).json({ message: "Report saved.", report });
//   } catch (error) {
//     console.error("🚨 Error:", error);
//     res.status(500).json({ message: "Error while saving report.", error: error.message });
//   }
// };

// ============================================================

// // Main controller
exports.addRemarkReports = async (req, res) => {
  try {
    const { userId, remark, role, signature, ward, formType, pdfData, seleMonth, wardName, mode } = req.body;
    const userWard = ward;
    const missingFields = [];
    if (!role) missingFields.push("role");
    if (!remark) missingFields.push("remark");
    if (!formType) missingFields.push("formType");
    if (!seleMonth) missingFields.push("seleMonth");
    if (!ward) missingFields.push("ward");

    if (missingFields.length) return res.status(400).json({ message: `Missing: ${missingFields.join(", ")}` });

    const formNumber = await generateFormNumber(formType);
    let document = null;

    if (req.file) {
      document = { formType, formNumber, pdfFile: req.file.path, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
    } else if (pdfData) {
      const pdfFilePath = saveBase64File(pdfData, formNumber);
      if (!pdfFilePath) return res.status(400).json({ message: "Invalid base64 PDF." });
      document = { formType, formNumber, pdfFile: pdfFilePath, uploadedAt: new Date(), seleMonth, approvedBy: [], doneBy: [] };
    } else {
      return res.status(400).json({ message: "PDF file or base64 required." });
    }

    // PDF Update Function - Modified to handle BOTH Junior Engineers
    const updatePdfWithAllSignatures = async (pdfPath, approvalData, formNum) => {
      try {
        const existingPdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        // Define signature positions - SEPARATE positions for BOTH Junior Engineers
        const signaturePositions = {
          'Lipik': { x: 50, y: height - 150 },
          'Junior Engineer_Ward': { x: 200, y: height - 150 },
          'Junior Engineer_Head Office': { x: 350, y: height - 150 },
          'Accountant': { x: 50, y: height - 250 },
          'Assistant Municipal Commissioner': { x: 200, y: height - 250 },
          'Dy.Municipal Commissioner': { x: 350, y: height - 250 }
        };

        // Add signatures for each approved role
        for (const approval of approvalData) {
          if (approval.signature) {
            let positionKey = approval.role;
            
            // Handle BOTH Junior Engineer positions based on userWard
            if (approval.role === 'Junior Engineer') {
              if (approval.userWard === 'Head Office') {
                positionKey = 'Junior Engineer_Head Office';
              } else {
                positionKey = 'Junior Engineer_Ward';
              }
            }
            
            const position = signaturePositions[positionKey];
            
            if (position) {
              // Add role label with ward info for Junior Engineers
              let roleLabel = approval.role;
              if (approval.role === 'Junior Engineer') {
                if (approval.userWard === 'Head Office') {
                  roleLabel = 'JE (Head Office)';
                } else {
                  roleLabel = `JE (${approval.ward || approval.userWard})`;
                }
              }
              
              firstPage.drawText(`${roleLabel}:`, {
                x: position.x,
                y: position.y + 30,
                size: 10,
                color: PDFLib.rgb(0, 0, 0)
              });

              // Add status
              firstPage.drawText(`Status: ${approval.status || 'verified'}`, {
                x: position.x,
                y: position.y + 15,
                size: 8,
                color: PDFLib.rgb(0, 0.5, 0)
              });

              // Add date
              firstPage.drawText(`Date: ${new Date(approval.date).toLocaleDateString()}`, {
                x: position.x,
                y: position.y,
                size: 8,
                color: PDFLib.rgb(0, 0, 0)
              });

              // Add signature image if available
              if (approval.signature && approval.signature.startsWith('data:image')) {
                try {
                  const signatureBase64 = approval.signature.split(',')[1];
                  const signatureBytes = Buffer.from(signatureBase64, 'base64');

                  let embeddedImage;
                  if (approval.signature.includes('png')) {
                    embeddedImage = await pdfDoc.embedPng(signatureBytes);
                  } else if (approval.signature.includes('jpg') || approval.signature.includes('jpeg')) {
                    embeddedImage = await pdfDoc.embedJpg(signatureBytes);
                  }

                  if (embeddedImage) {
                    firstPage.drawImage(embeddedImage, {
                      x: position.x,
                      y: position.y - 40,
                      width: 80,
                      height: 30
                    });
                  }
                } catch (imageError) {
                  firstPage.drawText('Signature Applied', {
                    x: position.x,
                    y: position.y - 20,
                    size: 8,
                    color: PDFLib.rgb(0, 0, 0.8)
                  });
                }
              } else {
                firstPage.drawText('Signature Applied', {
                  x: position.x,
                  y: position.y - 20,
                  size: 8,
                  color: PDFLib.rgb(0, 0, 0.8)
                });
              }
            }
          }
        }

        const pdfBytes = await pdfDoc.save();
        const updatedPdfPath = path.join(path.dirname(pdfPath), `updated_${formNum}_${Date.now()}.pdf`);
        fs.writeFileSync(updatedPdfPath, pdfBytes);
        return updatedPdfPath;
      } catch (error) {
        console.error('Error updating PDF:', error);
        throw error;
      }
    };

    // Create approval data from reporting remarks - INCLUDES BOTH Junior Engineers
    const createApprovalData = (reportingRemarks, targetWard) => {
      return reportingRemarks
        .filter(remark => {
          // Include remarks for the target ward OR Head Office Junior Engineers
          return remark.ward === targetWard || 
                 remark.userWard === targetWard || 
                 (remark.role === "Junior Engineer" && remark.userWard === "Head Office");
        })
        .map(remark => ({
          role: remark.role,
          remark: remark.remark,
          signature: remark.signature,
          date: remark.date,
          status: remark.remark === 'Approved' ? 'verified' : 'pending',
          ward: remark.ward,
          userWard: remark.userWard
        }))
        .sort((a, b) => {
          const hierarchy = ['Lipik', 'Junior Engineer', 'Accountant', 'Assistant Municipal Commissioner', 'Dy.Municipal Commissioner'];
          return hierarchy.indexOf(a.role) - hierarchy.indexOf(b.role);
        });
    };

    let report;

    if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
      report = await Report.findOne({ seleMonth, ward: wardName });
      if (!report) return res.status(400).json({ message: "Ward report not found." });

      const approved = areAllFormsApprovedByRole(report, "Junior Engineer", wardName);
      if (!approved) {
        const missing = getMissingFormTypes(report, "Junior Engineer", wardName, userId);
        return res.status(400).json({ message: `Ward JE must approve all forms. Missing: ${missing.join(", ")}` });
      }

      const jeRemark = {
        userId: new mongoose.Types.ObjectId(userId),
        role: "Junior Engineer",
        ward: "Head Office",
        userWard: "Head Office",
        remark,
        signature,
        date: new Date()
      };

      const exists = report.reportingRemarks.some(r => r.userId.toString() === userId && r.role === "Junior Engineer" && (r.ward === "Head Office" || r.userWard === "Head Office"));

      if (!exists) {
        if (remark === "Approved") {
          const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
          if (lipik?.documents) {
            for (let doc of lipik.documents) {
              if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
              doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, jeRemark], wardName);
              
              // Update PDF with Head Office JE signature
              try {
                const approvalData = createApprovalData([...report.reportingRemarks, jeRemark], wardName);
                const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
                doc.pdfFile = updatedPdfPath;
                doc.lastUpdated = new Date();
              } catch (pdfError) {
                console.error('Error updating PDF for Head Office JE:', pdfError);
              }
            }
          }
        }
        report.reportingRemarks.push(jeRemark);
        await report.save();
      }
      return res.status(201).json({ message: "Head Office JE remark added.", report });
    }

    report = await Report.findOne({ seleMonth, ward });
    if (!report) report = new Report({ seleMonth, ward, monthReport: seleMonth, reportingRemarks: [] });

    if (report.reportingRemarks.length === 0 && role !== "Lipik") {
      return res.status(400).json({ message: "First remark must be from Lipik." });
    }

    // Hierarchy checks
    if (role !== "Lipik") {
      const checks = {
        "Junior Engineer": "Lipik",
        "Accountant": "Junior Engineer",
        "Assistant Municipal Commissioner": "Accountant",
        "Dy.Municipal Commissioner": "Assistant Municipal Commissioner"
      };
      const checkRole = checks[role];
      if (checkRole) {
        const approved = checkRole === "Junior Engineer" && role === "Accountant"
          ? areAllFormsApprovedByRole(report, checkRole, ward) && areAllFormsApprovedByRole(report, checkRole, "Head Office")
          : areAllFormsApprovedByRole(report, checkRole, ward);

        if (!approved) {
          const missing = getMissingFormTypes(report, checkRole, checkRole === "Junior Engineer" ? [ward, "Head Office"].find(w => !areAllFormsApprovedByRole(report, checkRole, w)) : ward, userId);
          return res.status(400).json({ message: `${checkRole} must approve all forms. Missing: ${missing.join(", ")}` });
        }
      }
    }

    const index = report.reportingRemarks.findIndex(r => r.userId.toString() === userId && r.role === role && (r.ward === ward || r.userWard === ward));

    if (index !== -1) {
      const existing = report.reportingRemarks[index];
      existing.remark = remark;
      existing.signature = signature;
      existing.date = new Date();

      if (role === "Lipik") {
        const docs = existing.documents || [];
        const docIndex = docs.findIndex(d => d.formType === formType);

        if (docIndex !== -1) {
          const doc = docs[docIndex];
          doc.uploadedAt = new Date();
          doc.pdfFile = document.pdfFile;
          doc.approvedBy = remark === "Approved" ? [userId] : doc.approvedBy;
          doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
          
          // Update PDF with Lipik signature for updated document
          if (remark === "Approved") {
            try {
              const approvalData = createApprovalData(report.reportingRemarks, ward);
              const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
              doc.pdfFile = updatedPdfPath;
              doc.lastUpdated = new Date();
            } catch (pdfError) {
              console.error('Error updating PDF for Lipik update:', pdfError);
            }
          }
        } else {
          const newDoc = { ...document, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
          newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
          
          // Update PDF with Lipik signature for new document
          if (remark === "Approved") {
            try {
              const approvalData = createApprovalData(report.reportingRemarks, ward);
              const updatedPdfPath = await updatePdfWithAllSignatures(newDoc.pdfFile, approvalData, newDoc.formNumber);
              newDoc.pdfFile = updatedPdfPath;
              newDoc.lastUpdated = new Date();
            } catch (pdfError) {
              console.error('Error updating PDF for Lipik new:', pdfError);
            }
          }
          
          docs.push(newDoc);
        }
        existing.documents = docs;
      }

      // Update PDF for all approved roles
      if (remark === "Approved") {
        const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
        if (lipik?.documents) {
          for (let doc of lipik.documents) {
            if (role === "Lipik" || doc.formType === formType) {
              if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
              doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
              
              // Update PDF with current role signature
              try {
                const approvalData = createApprovalData(report.reportingRemarks, ward);
                const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
                doc.pdfFile = updatedPdfPath;
                doc.lastUpdated = new Date();
              } catch (pdfError) {
                console.error(`Error updating PDF for ${role}:`, pdfError);
              }
            }
          }
        }
      }

      report.reportingRemarks[index] = existing;
    } else {
      const remarkObj = {
        userId: new mongoose.Types.ObjectId(userId),
        ward,
        role,
        remark,
        signature,
        userWard,
        date: new Date(),
        documents: []
      };

      if (role === "Lipik" && remark === "Approved") {
        document.approvedBy.push(userId);
        document.doneBy = populateDoneByArray(document, [remarkObj], ward);
        
        // Update PDF with initial Lipik signature
        try {
          const approvalData = createApprovalData([remarkObj], ward);
          const updatedPdfPath = await updatePdfWithAllSignatures(document.pdfFile, approvalData, document.formNumber);
          document.pdfFile = updatedPdfPath;
          document.lastUpdated = new Date();
        } catch (pdfError) {
          console.error('Error updating PDF for initial Lipik:', pdfError);
        }
        
        remarkObj.documents.push(document);
      } else if (role !== "Lipik") {
        const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
        if (!lipik) return res.status(400).json({ message: "Lipik remark not found." });

        const docIndex = lipik.documents.findIndex(d => d.formType === formType);

        if (docIndex !== -1) {
          const doc = lipik.documents[docIndex];
          if (!doc.signatures) doc.signatures = {};
          doc.signatures[role] = signature;
          if (remark === "Approved" && !doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
          doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, remarkObj], ward);
          
          // Update PDF with new role signature
          if (remark === "Approved") {
            try {
              const approvalData = createApprovalData([...report.reportingRemarks, remarkObj], ward);
              const updatedPdfPath = await updatePdfWithAllSignatures(doc.pdfFile, approvalData, doc.formNumber);
              doc.pdfFile = updatedPdfPath;
              doc.lastUpdated = new Date();
            } catch (pdfError) {
              console.error(`Error updating PDF for ${role}:`, pdfError);
            }
          }
        } else {
          const newDoc = { ...document, signatures: { [role]: signature }, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
          newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
          
          // Update PDF for new document with non-Lipik role
          if (remark === "Approved") {
            try {
              const approvalData = createApprovalData([...report.reportingRemarks, remarkObj], ward);
              const updatedPdfPath = await updatePdfWithAllSignatures(newDoc.pdfFile, approvalData, newDoc.formNumber);
              newDoc.pdfFile = updatedPdfPath;
              newDoc.lastUpdated = new Date();
            } catch (pdfError) {
              console.error(`Error updating PDF for ${role} new doc:`, pdfError);
            }
          }
          
          lipik.documents.push(newDoc);
        }
      }

      report.reportingRemarks.push(remarkObj);
    }

    const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
    lipik?.documents?.forEach(doc => doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward));
    await report.save();

    res.status(201).json({ message: "Report saved.", report });
  } catch (error) {
    console.error("🚨 Error:", error);
    res.status(500).json({ message: "Error while saving report.", error: error.message });
  }
};


exports.searchReport = async (req, res) => {
    
    try {
        const { month } = req.body;
     


        if (!month) {
            return res.status(400).json({
                message: "Missing required field: month"
            });
        }

        const reports = await Report.find({ seleMonth: month });

        res.status(200).json(reports);
    } catch (error) {
        console.error("❌ Error searching reports:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};




// exports.deleteMonthReport = async (req, res) => {
//   const { month } = req.params;

//   try {
//     const deletedReport = await Report.findOneAndDelete({ monthReport: month });

//     if (!deletedReport) {
//       return res.status(404).json({ message: `Report for month ${month} not found.` });
//     }

//     res.status(200).json({ message: `Report for month ${month} deleted successfully.` });
//   } catch (error) {
//     console.error('Error deleting report:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };


exports.deleteMonthReport = async (req, res) => {
    const { month } = req.params;
  
    try {
      // Step 1: Find the report for the given month
      const report = await Report.findOne({ monthReport: month });
  
      if (!report) {
        return res.status(404).json({ message: `Report for month ${month} not found.` });
      }
  
      // Step 2: Delete the PDF related to the report (assuming it's stored in the report)
      const pdfFileName = report.pdfFileName; // assuming the PDF path is stored in `pdfFileName`
      if (pdfFileName) {
        const pdfFilePath = path.join(uploadsDir, pdfFileName);
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath); // Delete the PDF file
          console.log(`Deleted PDF file: ${pdfFileName}`);
        }
      }
  
      // Step 3: Delete related signature files in the 'uploads' folder
      const usedFiles = new Set();
  
      // Collect all used signature files from the reportingRemarks.documents array
      report.reportingRemarks.forEach(remark => {
        if (remark.documents && Array.isArray(remark.documents)) {
          remark.documents.forEach(doc => {
            const sig = doc.signature;
            if (sig && !sig.startsWith('data:image')) {
              usedFiles.add(sig); // Add file path to set for comparison
            }
          });
        }
      });
  
      // Step 4: Delete any other signature files that are no longer used
      const filesInUploads = fs.readdirSync(uploadsDir);
      filesInUploads.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        if (!usedFiles.has(filePath)) {
          fs.unlinkSync(filePath); // Delete unused signature file
          console.log(`Deleted unused file: ${file}`);
        }
      });
  
      // Step 5: Delete the report from the database
      await Report.findOneAndDelete({ monthReport: month });
  
      res.status(200).json({ message: `Report for month ${month} deleted successfully along with associated files.` });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };





//   exports.clearAllReports = async (req, res) => {
//   try {
//     // Step 1: Get all reports before deleting
//     const reports = await Report.find({});

//     // Step 2: Collect all used file names (PDFs and signatures)
//     const filesToDelete = new Set();

//     reports.forEach(report => {
//       // Add PDF file
//       if (report.pdfFileName && !report.pdfFileName.startsWith('data:')) {
//         filesToDelete.add(path.basename(report.pdfFileName));
//       }

//       // Add all signature files from documents
//       report.reportingRemarks?.forEach(remark => {
//         remark.documents?.forEach(doc => {
//           const sig = doc.signature;
//           if (sig && !sig.startsWith('data:image')) {
//             filesToDelete.add(path.basename(sig));
//           }
//         });
//       });
//     });

//     // Step 3: Delete each collected file from the uploads folder
//     const allFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
//     allFiles.forEach(file => {
//       if (filesToDelete.has(file)) {
//         const filePath = path.join(uploadsDir, file);
//         fs.unlinkSync(filePath);
//         console.log(`🗑️ Deleted file: ${file}`);
//       }
//     });

//     // Step 4: Delete all reports from the database
//     await Report.deleteMany({});

//     res.status(200).json({ message: 'All Report documents and associated files have been successfully deleted.' });
//   } catch (error) {
//     console.error('❌ Error clearing Report collection:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };



// exports.clearAllReports = async (req, res) => {
//   try {
//     // Step 1: Get all reports before deleting
//     const reports = await Report.find({});

//     reports.forEach(report => {
//       // Delete PDF file if it exists
//       const pdfFileName = report.pdfFileName;
//       if (pdfFileName && !pdfFileName.startsWith('data:')) {
//         const pdfFilePath = path.join(uploadsDir, path.basename(pdfFileName));
//         if (fs.existsSync(pdfFilePath)) {
//           fs.unlinkSync(pdfFilePath);
//           console.log(`🗑️ Deleted PDF file: ${pdfFileName}`);
//         }
//       }

//       // Delete all related signature files
//       report.reportingRemarks?.forEach(remark => {
//         remark.documents?.forEach(doc => {
//           const sig = doc.signature;
//           if (sig && !sig.startsWith('data:image')) {
//             const sigPath = path.join(uploadsDir, path.basename(sig));
//             if (fs.existsSync(sigPath)) {
//               fs.unlinkSync(sigPath);
//               console.log(`🗑️ Deleted signature file: ${sig}`);
//             }
//           }
//         });
//       });
//     });

//     // Step 2: Delete all reports from the database
//     await Report.deleteMany({});

//     res.status(200).json({ message: 'All Report documents and associated files have been successfully deleted.' });
//   } catch (error) {
//     console.error('❌ Error clearing Report collection:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };





// exports.clearAllReports = async (req, res) => {
//   try {
//     // Step 1: Get all reports before deleting
//     const reports = await Report.find({});
//     if (!reports.length) {
//       return res.status(200).json({ message: 'No reports found to delete.' });
//     }

//     // Step 2: Collect all PDF and signature file paths
//     const filesToDelete = new Set();

//     reports.forEach(report => {
//       // PDF file
//       if (report.pdfFileName && !report.pdfFileName.startsWith('data:')) {
//         filesToDelete.add(path.join(uploadsDir, path.basename(report.pdfFileName)));
//       }

//       // Signature files
//       report.reportingRemarks?.forEach(remark => {
//         remark.documents?.forEach(doc => {
//           const sig = doc.signature;
//           if (sig && !sig.startsWith('data:image')) {
//             filesToDelete.add(path.join(uploadsDir, path.basename(sig)));
//           }
//         });
//       });
//     });

//     // Step 3: Delete each collected file
//     for (const filePath of filesToDelete) {
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//         console.log(`🗑️ Deleted file: ${path.basename(filePath)}`);
//       } else {
//         console.warn(`⚠️ File not found: ${path.basename(filePath)}`);
//       }
//     }

//     // Step 4: Delete all reports
//     await Report.deleteMany({});

//     res.status(200).json({ message: '✅ All reports and associated files deleted successfully.' });
//   } catch (error) {
//     console.error('❌ Error while clearing reports:', error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// };



exports.clearAllReports = async (req, res) => {
  try {
    const reports = await Report.find({});
    if (!reports.length) {
      return res.status(200).json({ message: 'No reports found to delete.' });
    }

    const filesToDelete = new Set();

    const extractFileName = filePath => {
      if (!filePath) return null;
      try {
        const url = new URL(filePath);
        return path.basename(url.pathname);
      } catch {
        return path.basename(filePath);
      }
    };

    reports.forEach(report => {
      const pdfName = extractFileName(report.pdfFileName);
      if (pdfName) {
        filesToDelete.add(path.join(uploadsDir, pdfName));
      }

      report.reportingRemarks?.forEach(remark => {
        remark.documents?.forEach(doc => {
          const sigName = extractFileName(doc.signature);
          if (sigName && !sigName.startsWith('data:image')) {
            filesToDelete.add(path.join(uploadsDir, sigName));
          }
        });
      });
    });

    for (const filePath of filesToDelete) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${path.basename(filePath)}`);
      } else {
        console.warn(`⚠️ File not found: ${path.basename(filePath)}`);
      }
    }

    await Report.deleteMany({});
    res.status(200).json({ message: '✅ All reports and associated files deleted successfully.' });
  } catch (error) {
    console.error('❌ Error while clearing reports:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
 