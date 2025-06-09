const Report = require('../models/report');
const mongoose = require("mongoose");
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');

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



// ---------------------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
            
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided. "
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

        
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "The first remark must be from the role 'Lipik'."
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward,
//                 userWard,
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             if (remark === "Approved") {
//                 jeRemark.approvedBy = new mongoose.Types.ObjectId(userId);
//             }

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.remark === remark
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                         if (docIndex !== -1) {
//                             const doc = lipikRemark.documents[docIndex];
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                             lipikRemark.documents[docIndex] = doc;
//                         }
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Junior Engineer remark added to ward ${wardName} successfully.`,
//                 report: wardReport
//             });
//         }

       
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             report.ward === ward
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
//             existing.documents = existing.documents || [];

//             const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

//             if (mode === "edit") {
//                 if (docIndex !== -1) {
//                     existing.documents[docIndex] = document;
//                 } else {
//                     existing.documents.push(document);
//                 }
//             } else {
//                 const alreadyExists = existing.documents.some(doc => doc.formType === formType);
//                 if (!alreadyExists && document) {
//                     existing.documents.push(document);
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };
// -----------------------------------------------------------------------------------
// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Check workflow sequence based on role
//         const workflowSequence = [
//             "Lipik",
//             "Junior Engineer", // Ward specific
//             "Junior Engineer", // Head Office - special case
//             "Accountant",
//             "Assistant Municipal Commissioner",
//             "Dy.Municipal Commissioner"
//         ];

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "The first remark must be from the role 'Lipik'."
//                 });
//             }

//             // Workflow validation for JE Head Office
//             // Check if Ward JE has approved before Head Office JE can approve
//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 r.ward === wardName && 
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve before Head Office Junior Engineer can approve.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward,
//                 userWard,
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             if (remark === "Approved") {
//                 jeRemark.approvedBy = new mongoose.Types.ObjectId(userId);
//             }

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.remark === remark
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                         if (docIndex !== -1) {
//                             const doc = lipikRemark.documents[docIndex];
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                             lipikRemark.documents[docIndex] = doc;
//                         }
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Junior Engineer remark added to ward ${wardName} successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow sequence validation
//         if (role !== "Lipik") {
//             // Get the current approved roles in this ward report
//             const approvedRoles = report.reportingRemarks
//                 .filter(r => r.remark === "Approved")
//                 .map(r => r.role);

//             // Find the expected index of the current role in the workflow
//             const roleIndex = workflowSequence.indexOf(role);
            
//             // Special case for Junior Engineer from Head Office
//             if (role === "Junior Engineer" && ward === "Head Office") {
//                 // Head Office JE comes after ward JE (index 2)
//                 const expectedPrevRole = workflowSequence[1]; // Ward JE

//                 // Check if Ward JE has approved
//                 const prevRoleApproved = report.reportingRemarks.some(r => 
//                     r.role === expectedPrevRole && 
//                     r.ward === ward &&
//                     r.remark === "Approved"
//                 );

//                 if (!prevRoleApproved) {
//                     return res.status(400).json({
//                         message: `Ward Junior Engineer must approve before Head Office Junior Engineer can approve.`
//                     });
//                 }
//             } else if (roleIndex > 0) {
//                 // For other roles, check if the previous role in sequence has approved
//                 const expectedPrevRole = workflowSequence[roleIndex - 1];
                
//                 // Special case: if current role is Accountant, must check if Head Office JE has approved
//                 if (role === "Accountant") {
//                     const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                         r.role === "Junior Engineer" && 
//                         r.ward === "Head Office" &&
//                         r.remark === "Approved"
//                     );
                    
//                     if (!headOfficeJEApproved) {
//                         return res.status(400).json({
//                             message: "Head Office Junior Engineer must approve before Accountant can approve."
//                         });
//                     }
//                 } else {
//                     // For other roles, check if the previous role has approved
//                     const prevRoleApproved = report.reportingRemarks.some(r => 
//                         r.role === expectedPrevRole && 
//                         r.remark === "Approved"
//                     );
                    
//                     if (!prevRoleApproved) {
//                         return res.status(400).json({
//                             message: `${expectedPrevRole} must approve before ${role} can approve.`
//                         });
//                     }
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             report.ward === ward
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
//             existing.documents = existing.documents || [];

//             const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

//             if (mode === "edit") {
//                 if (docIndex !== -1) {
//                     existing.documents[docIndex] = document;
//                 } else {
//                     existing.documents.push(document);
//                 }
//             } else {
//                 const alreadyExists = existing.documents.some(doc => doc.formType === formType);
//                 if (!alreadyExists && document) {
//                     existing.documents.push(document);
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };
// -----------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Check workflow sequence based on role
//         const workflowSequence = [
//             "Lipik",
//             "Junior Engineer", // Ward specific
//             "Junior Engineer", // Head Office - special case
//             "Accountant",
//             "Assistant Municipal Commissioner",
//             "Dy.Municipal Commissioner"
//         ];

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "The first remark must be from the role 'Lipik'."
//                 });
//             }

//             // Improved workflow validation for JE Head Office
//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 r.ward === wardName && // Check ward-specific JE
//                 r.userWard === wardName && // Additional check for user's ward
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve before Head Office Junior Engineer can approve.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward,
//                 userWard,
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             if (remark === "Approved") {
//                 jeRemark.approvedBy = new mongoose.Types.ObjectId(userId);
//             }

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.remark === remark
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                         if (docIndex !== -1) {
//                             const doc = lipikRemark.documents[docIndex];
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                             lipikRemark.documents[docIndex] = doc;
//                         }
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Junior Engineer remark added to ward ${wardName} successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Enhanced workflow sequence validation
//         if (role !== "Lipik") {
//             const roleIndex = workflowSequence.indexOf(role);
            
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 // For ward-specific JE, only check if Lipik has approved
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.ward === ward &&
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve before Ward Junior Engineer can approve."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 // For Accountant, check both ward JE and Head Office JE approvals
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     r.ward === ward &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     r.ward === "Head Office" &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved) {
//                     return res.status(400).json({
//                         message: `Ward Junior Engineer must approve before Accountant can approve.`
//                     });
//                 }

//                 if (!headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Head Office Junior Engineer must approve before Accountant can approve."
//                     });
//                 }
//             } else if (roleIndex > 0) {
//                 // For other roles, check previous role in sequence
//                 const expectedPrevRole = workflowSequence[roleIndex - 1];
//                 const prevRoleApproved = report.reportingRemarks.some(r => 
//                     r.role === expectedPrevRole && 
//                     r.ward === ward &&
//                     r.remark === "Approved"
//                 );

//                 if (!prevRoleApproved) {
//                     return res.status(400).json({
//                         message: `${expectedPrevRole} must approve before ${role} can approve.`
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             report.ward === ward
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
//             existing.documents = existing.documents || [];

//             const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

//             if (mode === "edit") {
//                 if (docIndex !== -1) {
//                     existing.documents[docIndex] = document;
//                 } else {
//                     existing.documents.push(document);
//                 }
//             } else {
//                 const alreadyExists = existing.documents.some(doc => doc.formType === formType);
//                 if (!alreadyExists && document) {
//                     existing.documents.push(document);
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };
// ----------------------------------------------------------------------------
// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "The first remark must be from the role 'Lipik'."
//                 });
//             }

//             // Check if ward JE has approved
//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 r.ward === wardName && 
//                 r.remark === "Approved"
//             );

//             // Only proceed if ward JE has approved
//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve first.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             if (remark === "Approved") {
//                 jeRemark.approvedBy = new mongoose.Types.ObjectId(userId);
//             }

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.ward === "Head Office"
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                         if (docIndex !== -1) {
//                             const doc = lipikRemark.documents[docIndex];
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                             lipikRemark.documents[docIndex] = doc;
//                         }
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve first."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     r.ward === ward &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     r.ward === "Head Office" &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved || !headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Both Ward Junior Engineer and Head Office Junior Engineer must approve first."
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 const accountantApproved = report.reportingRemarks.some(r => 
//                     r.role === "Accountant" && 
//                     r.remark === "Approved"
//                 );

//                 if (!accountantApproved) {
//                     return res.status(400).json({
//                         message: "Accountant must approve first."
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 const amcApproved = report.reportingRemarks.some(r => 
//                     r.role === "Assistant Municipal Commissioner" && 
//                     r.remark === "Approved"
//                 );

//                 if (!amcApproved) {
//                     return res.status(400).json({
//                         message: "Assistant Municipal Commissioner must approve first."
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             r.ward === ward
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
//             existing.documents = existing.documents || [];

//             const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

//             if (mode === "edit") {
//                 if (docIndex !== -1) {
//                     existing.documents[docIndex] = document;
//                 } else {
//                     existing.documents.push(document);
//                 }
//             } else {
//                 const alreadyExists = existing.documents.some(doc => doc.formType === formType);
//                 if (!alreadyExists && document) {
//                     existing.documents.push(document);
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };

// -----------------------------------------------------------------------


// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             // Check if ward JE has approved - using OR condition for ward/userWard
//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 (r.ward === wardName || r.userWard === wardName) && 
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve first.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve first."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     r.ward === ward &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === "Head Office" || r.userWard === "Head Office") &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved || !headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Both Ward Junior Engineer and Head Office Junior Engineer must approve first."
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 const accountantApproved = report.reportingRemarks.some(r => 
//                     r.role === "Accountant" && 
//                     r.remark === "Approved"
//                 );

//                 if (!accountantApproved) {
//                     return res.status(400).json({
//                         message: "Accountant must approve first."
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 const amcApproved = report.reportingRemarks.some(r => 
//                     r.role === "Assistant Municipal Commissioner" && 
//                     r.remark === "Approved"
//                 );

//                 if (!amcApproved) {
//                     return res.status(400).json({
//                         message: "Assistant Municipal Commissioner must approve first."
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
//             existing.documents = existing.documents || [];

//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };
// -------------------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             // Check if ward JE has approved - using OR condition for ward/userWard
//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 (r.ward === wardName || r.userWard === wardName) && 
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve first.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve first."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 // FIXED: Check both ward and userWard fields for Junior Engineer approvals
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === ward || r.userWard === ward) &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === "Head Office" || r.userWard === "Head Office") &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved || !headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Both Ward Junior Engineer and Head Office Junior Engineer must approve first."
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 const accountantApproved = report.reportingRemarks.some(r => 
//                     r.role === "Accountant" && 
//                     r.remark === "Approved"
//                 );

//                 if (!accountantApproved) {
//                     return res.status(400).json({
//                         message: "Accountant must approve first."
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 const amcApproved = report.reportingRemarks.some(r => 
//                     r.role === "Assistant Municipal Commissioner" && 
//                     r.remark === "Approved"
//                 );

//                 if (!amcApproved) {
//                     return res.status(400).json({
//                         message: "Assistant Municipal Commissioner must approve first."
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
//             existing.documents = existing.documents || [];

//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };
// ----------------------------------------------------------------------


// ----------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         } else {
//                             const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                             if (docIndex !== -1) {
//                                 const existingDoc = lipikRemark.documents[docIndex];
//                                 if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                                     existingDoc.approvedBy.push(userId);
//                                 }
//                             }
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 (r.ward === wardName || r.userWard === wardName) && 
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve first.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             // Update the original ward's report to include Head Office JE approval
//             let originalWardReport = await Report.findOne({ seleMonth, ward: wardName });
//             if (originalWardReport) {
//                 const lipikRemark = originalWardReport.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (remark === "Approved" && !doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//                 await originalWardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve first."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === ward || r.userWard === ward) &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === "Head Office" || r.userWard === "Head Office") &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved || !headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Both Ward Junior Engineer and Head Office Junior Engineer must approve first."
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 const accountantApproved = report.reportingRemarks.some(r => 
//                     r.role === "Accountant" && 
//                     r.remark === "Approved"
//                 );

//                 if (!accountantApproved) {
//                     return res.status(400).json({
//                         message: "Accountant must approve first."
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 const amcApproved = report.reportingRemarks.some(r => 
//                     r.role === "Assistant Municipal Commissioner" && 
//                     r.remark === "Approved"
//                 );

//                 if (!amcApproved) {
//                     return res.status(400).json({
//                         message: "Assistant Municipal Commissioner must approve first."
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
            
//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }

// }; 


// ------------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark) {
//                     // Check if document with this formType already exists
//                     const existingDocIndex = lipikRemark.documents.findIndex(doc => doc.formType === document.formType);
//                     if (existingDocIndex === -1) {
//                         // If no document with this formType exists, add new one
//                         remarkObj.documents.push(document);
//                     } else {
//                         // If document exists, update it
//                         lipikRemark.documents[existingDocIndex] = {
//                             ...document,
//                             approvedBy: [userId]
//                         };
//                     }
//                 } else {
//                     remarkObj.documents.push(document);
//                 }
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         const existingDoc = lipikRemark.documents.find(doc => doc.formType === formType);
//                         if (!existingDoc) {
//                             // Add new document if formType doesn't exist
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         } else {
//                             // Update existing document's approval status
//                             if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                                 existingDoc.approvedBy.push(userId);
//                             }
//                             existingDoc.signatures = {
//                                 ...(existingDoc.signatures || {}),
//                                 [role]: signature
//                             };
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 (r.ward === wardName || r.userWard === wardName) && 
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve first.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             // Update the original ward's report to include Head Office JE approval
//             let originalWardReport = await Report.findOne({ seleMonth, ward: wardName });
//             if (originalWardReport) {
//                 const lipikRemark = originalWardReport.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (remark === "Approved" && !doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//                 await originalWardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from  Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve first."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === ward || r.userWard === ward) &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === "Head Office" || r.userWard === "Head Office") &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved || !headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Both Ward Junior Engineer and Head Office Junior Engineer must approve first."
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 const accountantApproved = report.reportingRemarks.some(r => 
//                     r.role === "Accountant" && 
//                     r.remark === "Approved"
//                 );

//                 if (!accountantApproved) {
//                     return res.status(400).json({
//                         message: "Accountant must approve first."
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 const amcApproved = report.reportingRemarks.some(r => 
//                     r.role === "Assistant Municipal Commissioner" && 
//                     r.remark === "Approved"
//                 );

//                 if (!amcApproved) {
//                     return res.status(400).json({
//                         message: "Assistant Municipal Commissioner must approve first."
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
            
//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         // Check if document with the same formType already exists
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             // If not exists, add as a new document (this is the key change)
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         } else {
//                             // If exists, update the existing document
//                             const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                             if (docIndex !== -1) {
//                                 const existingDoc = lipikRemark.documents[docIndex];
//                                 existingDoc.uploadedAt = new Date();
                                
//                                 // Update signatures
//                                 existingDoc.signatures = existingDoc.signatures || {};
//                                 existingDoc.signatures[role] = signature;
                                
//                                 // Update approvedBy
//                                 if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                                     existingDoc.approvedBy.push(userId);
//                                 }
//                             }
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             // Check if ward JE has approved - using OR condition for ward/userWard
//             const wardJEApproved = wardReport.reportingRemarks.some(r => 
//                 r.role === "Junior Engineer" && 
//                 (r.ward === wardName || r.userWard === wardName) && 
//                 r.remark === "Approved"
//             );

//             if (!wardJEApproved) {
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve first.`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 const lipikApproved = report.reportingRemarks.some(r => 
//                     r.role === "Lipik" && 
//                     r.remark === "Approved"
//                 );

//                 if (!lipikApproved) {
//                     return res.status(400).json({
//                         message: "Lipik must approve first."
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 // FIXED: Check both ward and userWard fields for Junior Engineer approvals
//                 const wardJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === ward || r.userWard === ward) &&
//                     r.remark === "Approved"
//                 );

//                 const headOfficeJEApproved = report.reportingRemarks.some(r => 
//                     r.role === "Junior Engineer" && 
//                     (r.ward === "Head Office" || r.userWard === "Head Office") &&
//                     r.remark === "Approved"
//                 );

//                 if (!wardJEApproved || !headOfficeJEApproved) {
//                     return res.status(400).json({
//                         message: "Both Ward Junior Engineer and Head Office Junior Engineer must approve first."
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 const accountantApproved = report.reportingRemarks.some(r => 
//                     r.role === "Accountant" && 
//                     r.remark === "Approved"
//                 );

//                 if (!accountantApproved) {
//                     return res.status(400).json({
//                         message: "Accountant must approve first."
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 const amcApproved = report.reportingRemarks.some(r => 
//                     r.role === "Assistant Municipal Commissioner" && 
//                     r.remark === "Approved"
//                 );

//                 if (!amcApproved) {
//                     return res.status(400).json({
//                         message: "Assistant Municipal Commissioner must approve first."
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
            
//             // Handle documents for Lipik role
//             if (role === "Lipik") {
//                 existing.documents = existing.documents || [];
//                 const docIndex = existing.documents.findIndex(doc => doc.formType === formType);
                
//                 if (docIndex !== -1) {
//                     // Update existing document of the same type
//                     const existingDoc = existing.documents[docIndex];
//                     existingDoc.uploadedAt = new Date();
//                     existingDoc.pdfFile = document.pdfFile;
                    
//                     // Reset approvals if document is updated
//                     if (mode === "edit") {
//                         existingDoc.approvedBy = [userId];
//                     }
//                 } else {
//                     // Add new document with different formType
//                     existing.documents.push({
//                         ...document,
//                         uploadedAt: new Date(),
//                         approvedBy: [userId]
//                     });
//                 }
//             }

//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };
// -----------------------------------------------------------------------------

// Required form types that must be approved at each level
// const REQUIRED_FORM_TYPES = ['wardbilllist', 'form22', 'karyalayintipani'];

// Function to check if all required forms are approved by a specific role
// const areAllFormsApprovedByRole = (report, role, ward) => {
//   // Find the remark for the specified role
//   const roleRemark = report.reportingRemarks.find(r => 
//     r.role === role && 
//     (r.ward === ward || r.userWard === ward) &&
//     r.remark === "Approved"
//   );

//   if (!roleRemark) return false;

//   // For Lipik, check if all form types exist in their documents array
//   if (role === "Lipik") {
//     // Get all form types that the Lipik has in their documents
//     const approvedFormTypes = roleRemark.documents.map(doc => doc.formType);
    
//     // Check if all required form types are approved
//     return REQUIRED_FORM_TYPES.every(formType => approvedFormTypes.includes(formType));
//   } 
  
//   // For other roles, we need to check if they've approved all the Lipik documents
//   const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
  
//   if (!lipikRemark || !lipikRemark.documents || lipikRemark.documents.length === 0) {
//     return false;
//   }

//   // Check if all required form types exist and are approved by this user
//   return REQUIRED_FORM_TYPES.every(formType => {
//     const doc = lipikRemark.documents.find(d => d.formType === formType);
//     return doc && doc.approvedBy && doc.approvedBy.includes(roleRemark.userId.toString());
//   });
// };

// Main function to get missing form types that need approval
// const getMissingFormTypes = (report, role, ward, userId) => {
//   if (role === "Lipik") {
//     // For Lipik, check which forms are missing in their documents
//     const lipikRemark = report.reportingRemarks.find(r => 
//       r.role === role && 
//       (r.ward === ward || r.userWard === ward)
//     );
    
//     if (!lipikRemark || !lipikRemark.documents) {
//       return REQUIRED_FORM_TYPES;
//     }
    
//     const approvedFormTypes = lipikRemark.documents.map(doc => doc.formType);
//     return REQUIRED_FORM_TYPES.filter(formType => !approvedFormTypes.includes(formType));
//   } else {
//     // For other roles, check which Lipik documents they haven't approved
//     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
    
//     if (!lipikRemark || !lipikRemark.documents) {
//       return REQUIRED_FORM_TYPES;
//     }
    
//     return REQUIRED_FORM_TYPES.filter(formType => {
//       const doc = lipikRemark.documents.find(d => d.formType === formType);
//       return !doc || !doc.approvedBy || !doc.approvedBy.includes(userId);
//     });
//   }
// };

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [] 
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: []  
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 remarkObj.documents.push(document);
//             }

//             if (remark === "Approved" && document) {
//                 document.approvedBy.push(userId);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         }
//                     } else {
//                         // Check if document with the same formType already exists
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             // If not exists, add as a new document (this is the key change)
//                             lipikRemark.documents.push({
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : []  
//                             });
//                         } else {
//                             // If exists, update the existing document
//                             const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                             if (docIndex !== -1) {
//                                 const existingDoc = lipikRemark.documents[docIndex];
//                                 existingDoc.uploadedAt = new Date();
                                
//                                 // Update signatures
//                                 existingDoc.signatures = existingDoc.signatures || {};
//                                 existingDoc.signatures[role] = signature;
                                
//                                 // Update approvedBy
//                                 if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                                     existingDoc.approvedBy.push(userId);
//                                 }
//                             }
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             // Check if all forms are approved by Ward Junior Engineer
//             const wardJEAllFormsApproved = areAllFormsApprovedByRole(wardReport, "Junior Engineer", wardName);
            
//             if (!wardJEAllFormsApproved) {
//                 const missingForms = getMissingFormTypes(wardReport, "Junior Engineer", wardName, userId);
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message:`Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 // Check if Lipik has approved all forms
//                 const lipikAllFormsApproved = areAllFormsApprovedByRole(report, "Lipik", ward);
                
//                 if (!lipikAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Lipik", ward, userId);
//                     return res.status(400).json({
//                         message:`Lipik must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 // Check if Ward JE has approved all forms
//                 const wardJEAllFormsApproved = areAllFormsApprovedByRole(report, "Junior Engineer", ward);
                
//                 if (!wardJEAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Junior Engineer", ward, userId);
//                     return res.status(400).json({
//                         message:`Ward Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
                
//                 // Check if Head Office JE has approved all forms
//                 const headOfficeJEAllFormsApproved = areAllFormsApprovedByRole(report, "Junior Engineer", "Head Office");
                
//                 if (!headOfficeJEAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Junior Engineer", "Head Office", userId);
//                     return res.status(400).json({
//                         message:`Head Office Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 // Check if Accountant has approved all forms
//                 const accountantAllFormsApproved = areAllFormsApprovedByRole(report, "Accountant", ward);
                
//                 if (!accountantAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Accountant", ward, userId);
//                     return res.status(400).json({
//                         message:`Accountant must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 // Check if Assistant Municipal Commissioner has approved all forms
//                 const amcAllFormsApproved = areAllFormsApprovedByRole(report, "Assistant Municipal Commissioner", ward);
                
//                 if (!amcAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Assistant Municipal Commissioner", ward, userId);
//                     return res.status(400).json({
//                         message:`Assistant Municipal Commissioner must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
            
//             // Handle documents for Lipik role
//             if (role === "Lipik") {
//                 existing.documents = existing.documents || [];
//                 const docIndex = existing.documents.findIndex(doc => doc.formType === formType);
                
//                 if (docIndex !== -1) {
//                     // Update existing document of the same type
//                     const existingDoc = existing.documents[docIndex];
//                     existingDoc.uploadedAt = new Date();
//                     existingDoc.pdfFile = document.pdfFile;
                    
//                     // Reset approvals if document is updated
//                     if (mode === "edit") {
//                         existingDoc.approvedBy = [userId];
//                     }
//                 } else {
//                     // Add new document with different formType
//                     existing.documents.push({
//                         ...document,
//                         uploadedAt: new Date(),
//                         approvedBy: [userId]
//                     });
//                 }
//             }

//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };


// -------------------------------------------------------------------






// Helper function to populate doneBy array based on approvedBy and reportingRemarks







// const populateDoneByArray = (document, reportingRemarks, ward) => {
//     const doneBy = [];
    
//     if (document.approvedBy && document.approvedBy.length > 0) {
//         document.approvedBy.forEach(userId => {
//             // Find the corresponding remark for this user
//             const userRemark = reportingRemarks.find(remark => 
//                 remark.userId.toString() === userId.toString() && 
//                 remark.remark === "Approved"
//             );
            
//             if (userRemark) {
//                 doneBy.push({
//                     formType: document.formType,
//                     userId: userId,
//                     role: userRemark.role,
//                     status: 'verified',
//                     ward: ward,
//                     userWard: userRemark.userWard || userRemark.ward
//                 });
//             }
//         });
//     }
    
//     return doneBy;
// };



// Helper function to update document with doneBy array
// const updateDocumentDoneBy = (document, reportingRemarks, ward) => {
//     document.doneBy = populateDoneByArray(document, reportingRemarks, ward);
//     return document;
// };



// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [],
//                 doneBy: []
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: [],
//                     doneBy: []
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 if (remark === "Approved") {
//                     document.approvedBy.push(userId);
//                     // Update doneBy array immediately after adding to approvedBy
//                     document.doneBy = populateDoneByArray(document, [remarkObj], ward);
//                 }
//                 remarkObj.documents.push(document);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || [],
//                                 doneBy: existingDoc.doneBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             // Update doneBy array with current reporting remarks
//                             updatedDoc.doneBy = populateDoneByArray(updatedDoc, [...report.reportingRemarks, remarkObj], ward);
//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             const newDoc = {
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : [],
//                                 doneBy: []
//                             };
                            
//                             // Update doneBy array
//                             newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
//                             lipikRemark.documents.push(newDoc);
//                         }
//                     } else {
//                         // Check if document with the same formType already exists
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             // If not exists, add as a new document
//                             const newDoc = {
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : [],
//                                 doneBy: []
//                             };
                            
//                             // Update doneBy array
//                             newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
//                             lipikRemark.documents.push(newDoc);
//                         } else {
//                             // If exists, update the existing document
//                             const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                             if (docIndex !== -1) {
//                                 const existingDoc = lipikRemark.documents[docIndex];
//                                 existingDoc.uploadedAt = new Date();
                                
//                                 // Update signatures
//                                 existingDoc.signatures = existingDoc.signatures || {};
//                                 existingDoc.signatures[role] = signature;
                                
//                                 // Update approvedBy
//                                 if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                                     existingDoc.approvedBy.push(userId);
//                                 }
                                
//                                 // Update doneBy array
//                                 existingDoc.doneBy = populateDoneByArray(existingDoc, [...report.reportingRemarks, remarkObj], ward);
//                             }
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             // Check if all forms are approved by Ward Junior Engineer
//             const wardJEAllFormsApproved = areAllFormsApprovedByRole(wardReport, "Junior Engineer", wardName);
            
//             if (!wardJEAllFormsApproved) {
//                 const missingForms = getMissingFormTypes(wardReport, "Junior Engineer", wardName, userId);
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                             // Update doneBy array
//                             doc.doneBy = populateDoneByArray(doc, [...wardReport.reportingRemarks, jeRemark], wardName);
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//                 reportingRemarks: []
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 // Check if Lipik has approved all forms
//                 const lipikAllFormsApproved = areAllFormsApprovedByRole(report, "Lipik", ward);
                
//                 if (!lipikAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Lipik", ward, userId);
//                     return res.status(400).json({
//                         message: `Lipik must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 // Check if Ward JE has approved all forms
//                 const wardJEAllFormsApproved = areAllFormsApprovedByRole(report, "Junior Engineer", ward);
                
//                 if (!wardJEAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Junior Engineer", ward, userId);
//                     return res.status(400).json({
//                         message: `Ward Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
                
//                 // Check if Head Office JE has approved all forms
//                 const headOfficeJEAllFormsApproved = areAllFormsApprovedByRole(report, "Junior Engineer", "Head Office");
                
//                 if (!headOfficeJEAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Junior Engineer", "Head Office", userId);
//                     return res.status(400).json({
//                         message: `Head Office Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 // Check if Accountant has approved all forms
//                 const accountantAllFormsApproved = areAllFormsApprovedByRole(report, "Accountant", ward);
                
//                 if (!accountantAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Accountant", ward, userId);
//                     return res.status(400).json({
//                         message: `Accountant must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 // Check if Assistant Municipal Commissioner has approved all forms
//                 const amcAllFormsApproved = areAllFormsApprovedByRole(report, "Assistant Municipal Commissioner", ward);
                
//                 if (!amcAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Assistant Municipal Commissioner", ward, userId);
//                     return res.status(400).json({
//                         message: `Assistant Municipal Commissioner must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
            
//             // Handle documents for Lipik role
//             if (role === "Lipik") {
//                 existing.documents = existing.documents || [];
//                 const docIndex = existing.documents.findIndex(doc => doc.formType === formType);
                
//                 if (docIndex !== -1) {
//                     // Update existing document of the same type
//                     const existingDoc = existing.documents[docIndex];
//                     existingDoc.uploadedAt = new Date();
//                     existingDoc.pdfFile = document.pdfFile;
                    
//                     // Reset approvals if document is updated
//                     if (mode === "edit") {
//                         existingDoc.approvedBy = [userId];
//                     } else if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                         existingDoc.approvedBy.push(userId);
//                     }
                    
//                     // Update doneBy array
//                     existingDoc.doneBy = populateDoneByArray(existingDoc, report.reportingRemarks, ward);
//                 } else {
//                     // Add new document with different formType
//                     const newDoc = {
//                         ...document,
//                         uploadedAt: new Date(),
//                         approvedBy: remark === "Approved" ? [userId] : [],
//                         doneBy: []
//                     };
                    
//                     // Update doneBy array
//                     newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
//                     existing.documents.push(newDoc);
//                 }
//             }

//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                         // Update doneBy array
//                         doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         // Final update of all doneBy arrays in all documents
//         const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (lipikRemark && lipikRemark.documents?.length > 0) {
//             lipikRemark.documents.forEach(doc => {
//                 // Ensure doneBy array is initialized
//                 if (!doc.doneBy) {
//                     doc.doneBy = [];
//                 }
//                 // Update doneBy array with current reporting remarks
//                 doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
//             });
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };



// exports.addRemarkReports = async (req, res) => {
//     try {
//         const {
//             userId,
//             remark,
//             role,
//             signature,
//             ward,
//             formType,
//             pdfData,
//             seleMonth,
//             wardName,
//             mode
//         } = req.body;

//         let userWard = ward;

//         // Validate required fields
//         const missingFields = [];
//         if (!role) missingFields.push("role");
//         if (!remark) missingFields.push("remark");
//         if (!formType) missingFields.push("formType");
//         if (!seleMonth) missingFields.push("seleMonth");
//         if (!ward) missingFields.push("ward");

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: `Missing required fields: ${missingFields.join(", ")}`
//             });
//         }

//         // Handle document creation
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth,
//                 approvedBy: [],
//                 doneBy: []
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth,
//                     approvedBy: [],
//                     doneBy: []
//                 };
//             } else {
//                 return res.status(400).json({
//                     message: "Invalid base64 PDF data."
//                 });
//             }
//         } else {
//             return res.status(400).json({
//                 message: "No file or PDF data provided."
//             });
//         }

//         const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date(),
//                 documents: []
//             };
            
//             if (document && role === "Lipik") {
//                 if (remark === "Approved") {
//                     document.approvedBy.push(userId);
//                     // Update doneBy array immediately after adding to approvedBy
//                     document.doneBy = populateDoneByArray(document, [remarkObj], ward);
//                 }
//                 remarkObj.documents.push(document);
//             }

//             if (document && role !== "Lipik") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//                 if (lipikRemark) {
//                     lipikRemark.documents = lipikRemark.documents || [];
//                     const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//                     if (mode === "edit") {
//                         if (docIndex !== -1) {
//                             const existingDoc = lipikRemark.documents[docIndex];
//                             const updatedDoc = {
//                                 ...existingDoc,
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     ...(existingDoc.signatures || {}),
//                                     [role]: signature
//                                 },
//                                 approvedBy: existingDoc.approvedBy || [],
//                                 doneBy: existingDoc.doneBy || []
//                             };

//                             if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
//                                 updatedDoc.approvedBy.push(userId);
//                             }

//                             // Update doneBy array with current reporting remarks
//                             updatedDoc.doneBy = populateDoneByArray(updatedDoc, [...report.reportingRemarks, remarkObj], ward);
//                             lipikRemark.documents[docIndex] = updatedDoc;
//                         } else {
//                             const newDoc = {
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : [],
//                                 doneBy: []
//                             };
                            
//                             // Update doneBy array
//                             newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
//                             lipikRemark.documents.push(newDoc);
//                         }
//                     } else {
//                         // Check if document with the same formType already exists
//                         const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//                         if (!alreadyExists) {
//                             // If not exists, add as a new document
//                             const newDoc = {
//                                 ...document,
//                                 uploadedAt: new Date(),
//                                 signatures: {
//                                     [role]: signature
//                                 },
//                                 approvedBy: remark === "Approved" ? [userId] : [],
//                                 doneBy: []
//                             };
                            
//                             // Update doneBy array
//                             newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
//                             lipikRemark.documents.push(newDoc);
//                         } else {
//                             // If exists, update the existing document
//                             const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
//                             if (docIndex !== -1) {
//                                 const existingDoc = lipikRemark.documents[docIndex];
//                                 existingDoc.uploadedAt = new Date();
                                
//                                 // Update signatures
//                                 existingDoc.signatures = existingDoc.signatures || {};
//                                 existingDoc.signatures[role] = signature;
                                
//                                 // Update approvedBy
//                                 if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                                     existingDoc.approvedBy.push(userId);
//                                 }
                                
//                                 // Update doneBy array
//                                 existingDoc.doneBy = populateDoneByArray(existingDoc, [...report.reportingRemarks, remarkObj], ward);
//                             }
//                         }
//                     }
//                 } else {
//                     return res.status(400).json({
//                         message: "Lipik remark not found. Cannot attach document."
//                     });
//                 }
//             }
//             return remarkObj;
//         };

//         // Special handling for Junior Engineer at Head Office
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 return res.status(400).json({
//                     message: "Report not found for the specified ward."
//                 });
//             }

//             // Check if all forms are approved by Ward Junior Engineer
//             const wardJEAllFormsApproved = areAllFormsApprovedByRole(wardReport, "Junior Engineer", wardName);
            
//             if (!wardJEAllFormsApproved) {
//                 const missingForms = getMissingFormTypes(wardReport, "Junior Engineer", wardName, userId);
//                 return res.status(400).json({
//                     message: `Ward ${wardName} Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward: "Head Office",
//                 userWard: "Head Office",
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             // Check if Head Office JE already exists
//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 (r.ward === "Head Office" || r.userWard === "Head Office")
//             );

//             if (!jeExists) {
//                 if (remark === "Approved") {
//                     const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
//                     if (lipikRemark && lipikRemark.documents?.length > 0) {
//                         lipikRemark.documents.forEach(doc => {
//                             if (!doc.approvedBy.includes(userId)) {
//                                 doc.approvedBy.push(userId);
//                             }
//                             // Update doneBy array
//                             doc.doneBy = populateDoneByArray(doc, [...wardReport.reportingRemarks, jeRemark], wardName);
//                         });
//                     }
//                 }

//                 wardReport.reportingRemarks.push(jeRemark);
//                 await wardReport.save();
//             }

//             return res.status(201).json({
//                 message: `Head Office Junior Engineer remark added successfully.`,
//                 report: wardReport
//             });
//         }

//         // Get or create report for the specified ward
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//                 reportingRemarks: []
//             });
//         }

//         // Validate first remark must be from Lipik
//         if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//             return res.status(400).json({
//                 message: "The first remark must be from the role 'Lipik'."
//             });
//         }

//         // Workflow validation based on role
//         if (role !== "Lipik") {
//             if (role === "Junior Engineer" && ward !== "Head Office") {
//                 // Check if Lipik has approved all forms
//                 const lipikAllFormsApproved = areAllFormsApprovedByRole(report, "Lipik", ward);
                
//                 if (!lipikAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Lipik", ward, userId);
//                     return res.status(400).json({
//                         message: `Lipik must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Accountant") {
//                 // Check if Ward JE has approved all forms
//                 const wardJEAllFormsApproved = areAllFormsApprovedByRole(report, "Junior Engineer", ward);
                
//                 if (!wardJEAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Junior Engineer", ward, userId);
//                     return res.status(400).json({
//                         message: `Ward Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
                
//                 // Check if Head Office JE has approved all forms
//                 const headOfficeJEAllFormsApproved = areAllFormsApprovedByRole(report, "Junior Engineer", "Head Office");
                
//                 if (!headOfficeJEAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Junior Engineer", "Head Office", userId);
//                     return res.status(400).json({
//                         message: `Head Office Junior Engineer must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Assistant Municipal Commissioner") {
//                 // Check if Accountant has approved all forms
//                 const accountantAllFormsApproved = areAllFormsApprovedByRole(report, "Accountant", ward);
                
//                 if (!accountantAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Accountant", ward, userId);
//                     return res.status(400).json({
//                         message: `Accountant must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             } else if (role === "Dy.Municipal Commissioner") {
//                 // Check if Assistant Municipal Commissioner has approved all forms
//                 const amcAllFormsApproved = areAllFormsApprovedByRole(report, "Assistant Municipal Commissioner", ward);
                
//                 if (!amcAllFormsApproved) {
//                     const missingForms = getMissingFormTypes(report, "Assistant Municipal Commissioner", ward, userId);
//                     return res.status(400).json({
//                         message: `Assistant Municipal Commissioner must approve all forms first. Missing forms: ${missingForms.join(", ")}`
//                     });
//                 }
//             }
//         }

//         // Update existing remark or create a new one
//         const index = report.reportingRemarks.findIndex(r =>
//             r.userId.toString() === userId &&
//             r.role === role &&
//             (r.ward === ward || r.userWard === ward)
//         );

//         if (index !== -1) {
//             const existing = report.reportingRemarks[index];
//             existing.remark = remark;
//             existing.signature = signature;
//             existing.date = new Date();
            
//             // Handle documents for Lipik role
//             if (role === "Lipik") {
//                 existing.documents = existing.documents || [];
//                 const docIndex = existing.documents.findIndex(doc => doc.formType === formType);
                
//                 if (docIndex !== -1) {
//                     // Update existing document of the same type
//                     const existingDoc = existing.documents[docIndex];
//                     existingDoc.uploadedAt = new Date();
//                     existingDoc.pdfFile = document.pdfFile;
                    
//                     // Reset approvals if document is updated
//                     if (mode === "edit") {
//                         existingDoc.approvedBy = [userId];
//                     } else if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                         existingDoc.approvedBy.push(userId);
//                     }
                    
//                     // Update doneBy array
//                     existingDoc.doneBy = populateDoneByArray(existingDoc, report.reportingRemarks, ward);
//                 } else {
//                     // Add new document with different formType
//                     const newDoc = {
//                         ...document,
//                         uploadedAt: new Date(),
//                         approvedBy: remark === "Approved" ? [userId] : [],
//                         doneBy: []
//                     };
                    
//                     // Update doneBy array
//                     newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
//                     existing.documents.push(newDoc);
//                 }
//             }

//             if (remark === "Approved") {
//                 const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//                 if (lipikRemark && lipikRemark.documents?.length > 0) {
//                     lipikRemark.documents.forEach(doc => {
//                         if (!doc.approvedBy.includes(userId)) {
//                             doc.approvedBy.push(userId);
//                         }
//                         // Update doneBy array
//                         doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
//                     });
//                 }
//             }

//             report.reportingRemarks[index] = existing;
//         } else {
//             const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
//             report.reportingRemarks.push(newRemark);
//         }

//         // Final update of all doneBy arrays in all documents
//         const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
//         if (lipikRemark && lipikRemark.documents?.length > 0) {
//             lipikRemark.documents.forEach(doc => {
//                 // Ensure doneBy array is initialized
//                 if (!doc.doneBy) {
//                     doc.doneBy = [];
//                 }
//                 // Update doneBy array with current reporting remarks
//                 doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
//             });
//         }

//         await report.save();

//         res.status(201).json({
//             message: "Report added/updated successfully.",
//             report
//         });

//     } catch (error) {
//         console.error("🚨 Error adding/updating report:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };




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
          lipik?.documents?.forEach(doc => {
            if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
            doc.doneBy = populateDoneByArray(doc, [...report.reportingRemarks, jeRemark], wardName);
          });
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
        } else {
          const newDoc = { ...document, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
          newDoc.doneBy = populateDoneByArray(newDoc, report.reportingRemarks, ward);
          docs.push(newDoc);
        }
        existing.documents = docs;
      }

      if (remark === "Approved") {
        const lipik = report.reportingRemarks.find(r => r.role === "Lipik");
        lipik?.documents?.forEach(doc => {
          if (!doc.approvedBy.includes(userId)) doc.approvedBy.push(userId);
          doc.doneBy = populateDoneByArray(doc, report.reportingRemarks, ward);
        });
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
        } else {
          const newDoc = { ...document, signatures: { [role]: signature }, approvedBy: remark === "Approved" ? [userId] : [], doneBy: [] };
          newDoc.doneBy = populateDoneByArray(newDoc, [...report.reportingRemarks, remarkObj], ward);
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
 