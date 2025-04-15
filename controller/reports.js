const Report = require('../models/report');
const mongoose = require("mongoose");
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');

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



// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData,seleMonth,mode} = req.body;
//         console.log("formType--->>>",formType)

//         console.log("mode--<<<<",mode)

        
//         console.log("🗓️ Selected Month from frontend:", seleMonth);
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
//                 seleMonth
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth
//                 };
//             }
//         }
//            const createRemark = ({ userId, role, remark, signature, document }) => ({
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             signature,
//             date: new Date(),
//             documents: document ? [document] : []
//         });
//       let report = await Report.findOne({ seleMonth, ward });
//          if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }
//            if (formType === "document") {
//             if (!report.documents) report.documents = [];
//             if (document) {
//                 report.documents.push(document);
//             }
//         } else {
//              const index = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role &&
//                 r.documents?.some(doc => doc.formType === formType)
//             );

//   // 🛡️ Enforce nested rule:
//   if (report.reportingRemarks.length === 0) {
//     if (role !== "Lipik") {
//         return res.status(400).json({
//             message: "The first remark must be from the role 'Lipik'."
//         });
//     }
// } else {
//     const isLipikPresent = report.reportingRemarks.some(
//         r => r.role === "Lipik" && report.ward === ward
//     );

//     if (!isLipikPresent) {
//         return res.status(400).json({
//             message: "Lipik's remark is required for this ward before proceeding."
//         });
//     }
// }


//              if (index !== -1) {
//                 const existing = report.reportingRemarks[index];
//                 existing.remark = remark;
//                 existing.signature = signature;
//                 existing.date = new Date();
//                 if (document) {
//                     existing.documents = existing.documents || [];
//                     existing.documents.push(document);
//                 }
//                 report.reportingRemarks[index] = existing;
//             } else {
//                 const newRemark = createRemark({ userId, role, remark, signature, document });
//                 report.reportingRemarks.push(newRemark);
//             }
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

// ---------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth, mode } = req.body;
//         console.log("formType--->>>", formType);
//         console.log("mode--<<<<", mode);
//         console.log("🗓️ Selected Month from frontend:", seleMonth);

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
//                 seleMonth
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth
//                 };
//             }
//         }

//         const createRemark = ({ userId, role, remark, signature, document }) => ({
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             signature,
//             date: new Date(),
//             documents: document ? [document] : []
//         });

//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // 🗂️ Handle general document uploads
//         if (formType === "document") {
//             if (!report.documents) report.documents = [];
//             if (document) {
//                 report.documents.push(document);
//             }
//         } else {
//             // 🛡️ Enforce Lipik remark rule
//             if (report.reportingRemarks.length === 0) {
//                 if (role !== "Lipik") {
//                     return res.status(400).json({
//                         message: "The first remark must be from the role 'Lipik'."
//                     });
//                 }
//             } else {
//                 const isLipikPresent = report.reportingRemarks.some(
//                     r => r.role === "Lipik" && report.ward === ward
//                 );
//                 if (!isLipikPresent) {
//                     return res.status(400).json({
//                         message: "Lipik's remark is required for this ward before proceeding."
//                     });
//                 }
//             }

//             // 🔍 Find existing remark object by userId, role, ward
//             const index = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role &&
//                 report.ward === ward
//             );

//             if (index !== -1) {
//                 const existing = report.reportingRemarks[index];
//                 existing.remark = remark;
//                 existing.signature = signature;
//                 existing.date = new Date();
//                 existing.documents = existing.documents || [];

//                 const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

//                 if (mode === "edit") {
//                     if (docIndex !== -1) {
//                         // 🔁 Update document
//                         existing.documents[docIndex] = document;
//                     } else {
//                         // ➕ Add new formType
//                         existing.documents.push(document);
//                     }
//                 } else {
//                     const alreadyExists = existing.documents.some(doc => doc.formType === formType);
//                     if (!alreadyExists && document) {
//                         existing.documents.push(document);
//                     }
//                 }

//                 report.reportingRemarks[index] = existing;
//             } else {
//                 // 👶 Create new remark with this formType
//                 const newRemark = createRemark({ userId, role, remark, signature, document });
//                 report.reportingRemarks.push(newRemark);
//             }
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
// -------------------------------------------------------------------------

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
//             mode
//         } = req.body;

//         console.log("formType--->>>", formType);
//         console.log("mode--<<<<", mode);
//         console.log("🗓️ Selected Month from frontend:", seleMonth);

//         // 🚨 Validate required fields
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

//         // 🔢 Generate form number
//         const formNumber = await generateFormNumber(formType);
//         let document = null;

//         // 📁 Save PDF either from uploaded file or base64 data
//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth
//                 };
//             }
//         }

//         // 🧱 Helper function to create remark object
//         const createRemark = ({ userId, role, remark, signature, document }) => ({
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             signature,
//             date: new Date(),
//             documents: document ? [document] : []
//         });

//         // 📄 Check if report already exists
//         let report = await Report.findOne({ seleMonth, ward });

//         if (!report) {
//             // 🆕 Create new report for this month and ward
//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//             });
//         }

//         // 🗂️ Handle document-only uploads
//         if (formType === "document") {
//             if (!report.documents) report.documents = [];
//             if (document) {
//                 report.documents.push(document);
//             }
//         } else {
//             // 🛡️ Enforce Lipik-first rule
//             if (report.reportingRemarks.length === 0) {
//                 if (role !== "Lipik") {
//                     return res.status(400).json({
//                         message: "The first remark must be from the role 'Lipik'."
//                     });
//                 }
//             } else {
//                 const isLipikPresent = report.reportingRemarks.some(
//                     r => r.role === "Lipik" && report.ward === ward
//                 );
//                 if (!isLipikPresent) {
//                     return res.status(400).json({
//                         message: "Lipik's remark is required for this ward before proceeding."
//                     });
//                 }
//             }

//             // 🔍 Find if this user/role combo already exists for this ward
//             const index = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role &&
//                 report.ward === ward
//             );

//             if (index !== -1) {
//                 // 🔁 Update existing remark
//                 const existing = report.reportingRemarks[index];
//                 existing.remark = remark;
//                 existing.signature = signature;
//                 existing.date = new Date();
//                 existing.documents = existing.documents || [];

//                 const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

//                 if (mode === "edit") {
//                     if (docIndex !== -1) {
//                         // ♻️ Replace existing document
//                         existing.documents[docIndex] = document;
//                     } else {
//                         // ➕ Add new formType under same remark
//                         existing.documents.push(document);
//                     }
//                 } else {
//                     // 🧪 Check for duplicate formType
//                     const alreadyExists = existing.documents.some(doc => doc.formType === formType);
//                     if (!alreadyExists && document) {
//                         existing.documents.push(document);
//                     }
//                 }

//                 report.reportingRemarks[index] = existing;
//             } else {
//                 // 👶 Add new remark entry
//                 const newRemark = createRemark({ userId, role, remark, signature, document });
//                 report.reportingRemarks.push(newRemark);
//             }
//         }

//         // 💾 Save or update report
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


// ---------------------------------------------------------------
exports.addRemarkReports = async (req, res) => {
    try {
        const {
            userId,
            remark,
            role,
            signature,
            ward,
            formType,
            pdfData,
            seleMonth,
            mode
        } = req.body;

        // 🚨 Validate required fields
        const missingFields = [];
        if (!role) missingFields.push("role");
        if (!remark) missingFields.push("remark");
        if (!formType) missingFields.push("formType");
        if (!seleMonth) missingFields.push("seleMonth");
        if (!ward) missingFields.push("ward");

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        // 🔢 Generate form number
        const formNumber = await generateFormNumber(formType);
        let document = null;

        // 📁 Save PDF either from uploaded file or base64 data
        if (req.file) {
            document = {
                formType,
                formNumber,
                pdfFile: req.file.path,
                uploadedAt: new Date(),
                seleMonth
            };
        } else if (pdfData) {
            const pdfFilePath = saveBase64File(pdfData, formNumber);
            if (pdfFilePath) {
                document = {
                    formType,
                    formNumber,
                    pdfFile: pdfFilePath,
                    uploadedAt: new Date(),
                    seleMonth
                };
            } else {
                return res.status(400).json({
                    message: "Invalid base64 PDF data."
                });
            }
        } else {
            return res.status(400).json({
                message: "No file or PDF data provided."
            });
        }

        // 🧱 Helper function to create remark object
        const createRemark = ({ userId, role, remark, signature, document }) => ({
            userId: new mongoose.Types.ObjectId(userId),
            role,
            remark,
            signature,
            date: new Date(),
            documents: document ? [document] : []
        });

        // 📄 Check if report already exists
        let report = await Report.findOne({ seleMonth, ward });

        if (!report) {
            // 🆕 Create new report for this month and ward
            report = new Report({
                seleMonth,
                ward,
                monthReport: seleMonth,
            });
        }

        // 🛡️ Enforce Lipik-first rule
        if (report.reportingRemarks.length === 0) {
            if (role !== "Lipik") {
                return res.status(400).json({
                    message: "The first remark must be from the role 'Lipik'."
                });
            }
        }

        // Find if this user/role combo already exists for this ward
        const index = report.reportingRemarks.findIndex(r =>
            r.userId.toString() === userId &&
            r.role === role &&
            report.ward === ward
        );

        if (index !== -1) {
            // Update existing remark
            const existing = report.reportingRemarks[index];
            existing.remark = remark;
            existing.signature = signature;
            existing.date = new Date();
            existing.documents = existing.documents || [];

            const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

            if (mode === "edit") {
                if (docIndex !== -1) {
                    // Replace existing document
                    existing.documents[docIndex] = document;
                } else {
                    // Add new document under same remark
                    existing.documents.push(document);
                }
            } else {
                // Check for duplicate formType in existing documents
                const alreadyExists = existing.documents.some(doc => doc.formType === formType);
                if (!alreadyExists && document) {
                    existing.documents.push(document);
                }
            }

            report.reportingRemarks[index] = existing;
        } else {
            // Add new remark entry
            const newRemark = createRemark({ userId, role, remark, signature, document });
            report.reportingRemarks.push(newRemark);
        }

        // Save or update report
        await report.save();

        res.status(201).json({
            message: "Report added/updated successfully.",
            report
        });

    } catch (error) {
        console.error("🚨 Error adding/updating report:", error);
        res.status(500).json({
            message: "An error occurred while adding the report.",
            error: error.message
        });
    }
};


exports.searchReport = async (req, res) => {
    try {
        const { month } = req.body;
        // const month = req.params.month;


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


