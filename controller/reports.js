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
       
//         const { userId,remark, role, signature, ward, formType, pdfData,seleMonth } = req.body;
       
//         console.log("selected month from frontend",seleMonth)

//         if (!role || !remark || !formType) {
//             return res.status(400).json({ message: "Role, remark, and formType are required." });
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
//         const newReport = new Report({
//             reportingRemarks: [
//                 {
//                     userId: new mongoose.Types.ObjectId(userId), // ✅ Ensure ObjectId format
//                     role,
//                     remark,
//                     ward,
//                     signature,
//                     date: new Date(),
//                 }
//             ],
//             documents: document ? [document] : [] 
//         });

//         const savedReport = await newReport.save();

//         res.status(201).json({
//             message: "Report added successfully.",
//             report: savedReport
//         });

//     } catch (error) {
//         console.error("🚨 Error adding remark & PDFs:", error);
//         res.status(500).json({
//             message: "An error occurred while adding the report.",
//             error: error.message
//         });
//     }
// };

// ---------------------------------------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;

//         console.log("🗓️ Selected Month from frontend:", seleMonth);

//         if (!role || !remark || !formType || !seleMonth) {
//             return res.status(400).json({ message: "Role, remark, formType, and seleMonth are required." });
//         }

//         const formNumber = await generateFormNumber(formType);

//         let document = null;
//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth // document-specific seleMonth
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth // document-specific seleMonth
//                 };
//             }
//         }
//         let report = await Report.findOne({ seleMonth,'reportingRemarks.ward': ward });
//         const newRemark = {
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             ward,
//             signature,
//             date: new Date()
//         };
//         if (report) {
//             report.reportingRemarks.push(newRemark);
//             if (document) report.documents.push(document);
//             await report.save();
//           } else {
//             report = new Report({
//             seleMonth,
//             monthReport: seleMonth,
//             reportingRemarks: [newRemark],
//              documents: document ? [document] : []
//               });
//             await report.save();
//         }
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

// ------------------------------------------------------------------------------------------------------------------


// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;

//         console.log("🗓️ Selected Month from frontend:", seleMonth);

//         if (!role || !remark || !formType || !seleMonth) {
//             return res.status(400).json({ message: "Role, remark, formType, and seleMonth are required." });
//         }

//         const formNumber = await generateFormNumber(formType);

//         let document = null;
//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date(),
//                 seleMonth // document-specific seleMonth
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date(),
//                     seleMonth // document-specific seleMonth
//                 };
//             }
//         }

//         // ✨ Check if report exists for same seleMonth and ward
//         let report = await Report.findOne({
//             seleMonth,
//             'reportingRemarks.ward': ward
//         });

//         const newRemark = {
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             ward,
//             signature,
//             date: new Date()
//         };

//         if (report) {
//             // ✅ Update existing report
//             report.reportingRemarks.push(newRemark);
//             if (document) {
//                 report.documents.push(document);
//             }
//             await report.save();
//         } else {
//             // ✅ Create new report for this ward and month
//             report = new Report({
//                 seleMonth,
//                 monthReport: seleMonth,
//                 reportingRemarks: [newRemark],
//                 documents: document ? [document] : []
//             });
//             await report.save();
//         }

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

// -------------------------------------------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;

//         console.log("🗓️ Selected Month from frontend:", seleMonth);

//         if (!role || !remark || !formType || !seleMonth || !ward) {
//             return res.status(400).json({ message: "Role, remark, formType, seleMonth, and ward are required." });
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

//         // 🔍 Report = same seleMonth + same ward
//         let report = await Report.findOne({ seleMonth, ward });

//         const newRemark = {
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             ward,
//             signature,
//             date: new Date()
//         };

//         if (report) {
//             // 🔄 Check if same userId and role already exists
//             const existingIndex = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role
//             );

//             if (existingIndex !== -1) {
//                 // ✅ Update existing remark
//                 report.reportingRemarks[existingIndex] = newRemark;
//             } else {
//                 // ➕ Add new remark
//                 report.reportingRemarks.push(newRemark);
//             }

//             if (document) {
//                 report.documents.push(document);
//             }

//             await report.save();
//         } else {
//             // 🆕 New report for this ward and month
//             report = new Report({
//                 seleMonth,
//                 ward, // ✅ store ward directly
//                 monthReport: seleMonth,
//                 reportingRemarks: [newRemark],
//                 documents: document ? [document] : []
//             });
//             await report.save();
//         }

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
// ------------------------------------------------------------------------------

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;
//         console.log("🗓️ Selected Month from frontend:", seleMonth);

      
//         // if (!role || !remark || !formType || !seleMonth || !ward) {
//         //     return res.status(400).json({ message: "Role, remark, formType, seleMonth, and ward are required." });
//         // }

//         // Optionally, validate that userId is a valid ObjectId:
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: "Invalid userId." });
//         }

//         // Generate form number for the document (if applicable)
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

//         // Normalize seleMonth if needed (optional)
//         const normalizedMonth = seleMonth.trim().toUpperCase();

//         // 🔍 Look for an existing report with the same seleMonth and ward.
//         let report = await Report.findOne({ seleMonth: normalizedMonth, ward });

//         // Build the new remark object.
//         const newRemark = {
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             ward,
//             signature,
//             date: new Date()
//         };

//         if (report) {
//             console.log(`Existing report found for month ${normalizedMonth} and ward ${ward}.`);
//             // Check if a remark from the same user with the same role already exists.
//             const existingIndex = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role
//             );

//             if (existingIndex !== -1) {
//                 // Update the existing remark for that user+role.
//                 report.reportingRemarks[existingIndex] = newRemark;
//                 console.log("Existing remark updated.");
//             } else {
//                 // Add as a new remark.
//                 report.reportingRemarks.push(newRemark);
//                 console.log("New remark added to existing report.");
//             }

//             // Add the document if provided.
//             if (document) {
//                 report.documents.push(document);
//                 console.log("Document added to the report.");
//             }

//             await report.save();
//         } else {
//             // No report for this month and ward exists, so create a new one.
//             console.log(`No report found for month ${normalizedMonth} and ward ${ward}. Creating a new report.`);
//             report = new Report({
//                 seleMonth: normalizedMonth,
//                 ward, // Top-level ward field
//                 monthReport: normalizedMonth,
//                 reportingRemarks: [newRemark],
//                 documents: document ? [document] : []
//             });
//             await report.save();
//         }

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

// ------------------------------------------------
// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;
//         console.log("🗓️ Selected Month from frontend:", seleMonth);

//         // Validate required fields.
//         if (!role || !remark || !formType || !seleMonth || !ward) {
//             return res.status(400).json({ message: "Role, remark, formType, seleMonth, and ward are required." });
//         }

//         // Validate userId format.
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: "Invalid userId." });
//         }

//         // Generate form number for the document (if applicable)
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

//         // Normalize seleMonth (for consistent comparisons)
//         const normalizedMonth = seleMonth.trim().toUpperCase();

//         // Look for an existing report with the same normalized seleMonth and ward.
//         let report = await Report.findOne({ seleMonth: normalizedMonth, ward });

//         // Build the new remark object.
//         const newRemark = {
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             ward,
//             signature,
//             date: new Date()
//         };

//         if (report) {
//             console.log(`Existing report found for month ${normalizedMonth} and ward ${ward}.`);

//             // Check if a remark from the same user and role already exists.
//             const existingIndex = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role
//             );

//             if (existingIndex !== -1) {
//                 // Update existing remark.
//                 report.reportingRemarks[existingIndex] = newRemark;
//                 console.log("Existing remark updated.");
//             } else {
//                 // Add the new remark.
//                 report.reportingRemarks.push(newRemark);
//                 console.log("New remark added to existing report.");
//             }

//             // Append new document if provided.
//             if (document) {
//                 report.documents.push(document);
//                 console.log("Document added to the report.");
//             }

//             await report.save();
//         } else {
//             console.log(`No report found for month ${normalizedMonth} and ward ${ward}. Creating a new report.`);
//             // Create new report for this normalized month and ward.
//             report = new Report({
//                 seleMonth: normalizedMonth,
//                 ward, // Save ward at the top level
//                 monthReport: normalizedMonth,
//                 reportingRemarks: [newRemark],
//                 documents: document ? [document] : []
//             });
//             await report.save();
//         }

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
// =========================================================

// exports.addRemarkReports = async (req, res) => {
//     try {
//         const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;
//         console.log("🗓️ Selected Month from frontend:", seleMonth);

//         // Validate required fields.
//         if (!role || !remark || !formType || !seleMonth || !ward) {
//             return res.status(400).json({ message: "Role, remark, formType, seleMonth, and ward are required." });
//         }

//         // Validate userId.
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: "Invalid userId." });
//         }

//         // Generate form number.
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

//         // Normalize seleMonth for consistency (e.g., "mar-2025" becomes "MAR-2025")
//         const normalizedMonth = seleMonth.trim().toUpperCase();

//         // Look for an existing report for the same normalized seleMonth and ward.
//         let report = await Report.findOne({ seleMonth: normalizedMonth, ward });

//         // Build the new remark object.
//         const newRemark = {
//             userId: new mongoose.Types.ObjectId(userId),
//             role,
//             remark,
//             ward,
//             signature,
//             date: new Date()
//         };

//         if (report) {
//             console.log(`Existing report found for month ${normalizedMonth} and ward ${ward}.`);
//             // Check if a remark from the same user (userId) with the same role already exists.
//             const existingIndex = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId &&
//                 r.role === role
//             );

//             if (existingIndex !== -1) {
//                 // Overwrite the existing remark.
//                 report.reportingRemarks[existingIndex] = newRemark;
//                 console.log("Existing remark overwritten.");
//             } else {
//                 // Add the new remark.
//                 report.reportingRemarks.push(newRemark);
//                 console.log("New remark added.");
//             }

//             // Append new document if available.
//             if (document) {
//                 report.documents.push(document);
//                 console.log("Document added.");
//             }

//             await report.save();
//         } else {
//             console.log(`No report found for month ${normalizedMonth} and ward ${ward}. Creating a new report.`);
//             // Create a new report if none exists for the given month and ward.
//             report = new Report({
//                 seleMonth: normalizedMonth,
//                 ward, // must be included at the top level of your Report schema
//                 monthReport: normalizedMonth,
//                 reportingRemarks: [newRemark],
//                 documents: document ? [document] : []
//             });
//             await report.save();
//         }

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
// ================================================================

exports.addRemarkReports = async (req, res) => {
    try {
        const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;
        console.log("🗓️ Selected Month from frontend:", seleMonth);

        // Validate required fields.
        if (!role || !remark || !formType || !seleMonth || !ward) {
            return res.status(400).json({ message: "Role, remark, formType, seleMonth, and ward are required." });
        }

        // Validate that userId is a valid ObjectId.
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId." });
        }

        // Generate a form number.
        const formNumber = await generateFormNumber(formType);

        let document = null;
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
            }
        }

        // Normalize seleMonth for consistent comparisons.
        const normalizedMonth = seleMonth.trim().toUpperCase();

        // Look for an existing report using the normalized month and ward.
        let report = await Report.findOne({ seleMonth: normalizedMonth, ward });

        // Build the new remark object.
        const newRemark = {
            userId: new mongoose.Types.ObjectId(userId),
            role,
            remark,
            ward,
            signature,
            date: new Date()
        };

        if (report) {
            console.log(`Existing report found for month ${normalizedMonth} and ward ${ward}.`);

            // Check if a remark from the same user (using only userId) already exists.
            const existingIndex = report.reportingRemarks.findIndex(r =>
                r.userId.toString() === userId
            );

            if (existingIndex !== -1) {
                // Overwrite the existing remark.
                report.reportingRemarks[existingIndex] = newRemark;
                console.log("Existing remark overwritten.");
            } else {
                // Add the new remark.
                report.reportingRemarks.push(newRemark);
                console.log("New remark added to existing report.");
            }

            // Append new document if provided.
            if (document) {
                report.documents.push(document);
                console.log("Document added to the report.");
            }

            await report.save();
        } else {
            console.log(`No report found for month ${normalizedMonth} and ward ${ward}. Creating a new report.`);
            // Create a new report document for the given month and ward.
            report = new Report({
                seleMonth: normalizedMonth,
                ward, // Store ward at the top level.
                monthReport: normalizedMonth,
                reportingRemarks: [newRemark],
                documents: document ? [document] : []
            });
            await report.save();
        }

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
