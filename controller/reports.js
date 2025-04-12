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

// ---------------------------------------------------------------

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

//         if (!report) {
//             // 🆕 New report
//             const newRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role,
//                 remark,
//                 signature,
//                 date: new Date(),
//                 documents: document ? [document] : []
//             };

//             report = new Report({
//                 seleMonth,
//                 ward,
//                 monthReport: seleMonth,
//                 reportingRemarks: [newRemark]
//             });

//             await report.save();
//         } else {
//             // 🔄 Existing report
//             const existingIndex = report.reportingRemarks.findIndex(r =>
//                 r.userId.toString() === userId && r.role === role
//             );

//             if (existingIndex !== -1) {
//                 // ✅ Update existing remark
//                 const existingRemark = report.reportingRemarks[existingIndex];

//                 // Update fields
//                 existingRemark.remark = remark;
//                 existingRemark.signature = signature;
//                 existingRemark.date = new Date();

//                 if (document) {
//                     // 🔁 Push or replace existing document
//                     if (!existingRemark.documents) {
//                         existingRemark.documents = [];
//                     }
//                     existingRemark.documents.push(document);
//                 }

//                 report.reportingRemarks[existingIndex] = existingRemark;
//             } else {
//                 // ➕ Add new remark
//                 const newRemark = {
//                     userId: new mongoose.Types.ObjectId(userId),
//                     role,
//                     remark,
//                     signature,
//                     date: new Date(),
//                     documents: document ? [document] : []
//                 };
//                 report.reportingRemarks.push(newRemark);
//             }

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
// -----------------------------------------------------------------------------

exports.addRemarkReports = async (req, res) => {
    try {
        const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;

        console.log("🗓️ Selected Month from frontend:", seleMonth);

        // 🔍 Validate required fields
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

        const formNumber = await generateFormNumber(formType);

        // 📄 Prepare document if uploaded
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

        // 📌 Helper function to create a remark object
        const createRemark = ({ userId, role, remark, signature, document }) => ({
            userId: new mongoose.Types.ObjectId(userId),
            role,
            remark,
            signature,
            date: new Date(),
            documents: document ? [document] : []
        });

        // 🔍 Find existing report for seleMonth and ward
        let report = await Report.findOne({ seleMonth, ward });

        // if (!report) {
        //     // 🆕 Create new report
        //     const newRemark = createRemark({ userId, role, remark, signature, document });
        //     report = new Report({
        //         seleMonth,
        //         ward,
        //         monthReport: seleMonth,
        //         reportingRemarks: [newRemark]
        //     });
        // } 
        // // else 
        // // {
        // //     // 🔄 Update or add remark in existing report
        // //     const index = report.reportingRemarks.findIndex(r =>
        // //         r.userId.toString() === userId && r.role === role
        // //     );

        // //     if (index !== -1) {
        // //         // ✏️ Update existing remark
        // //         const existing = report.reportingRemarks[index];
        // //         existing.remark = remark;
        // //         existing.signature = signature;
        // //         existing.date = new Date();
        // //         if (document) {
        // //             existing.documents = existing.documents || [];
        // //             existing.documents.push(document);
        // //         }
        // //         report.reportingRemarks[index] = existing;
        // //     } else {
        // //         // ➕ Add new remark
        // //         const newRemark = createRemark({ userId, role, remark, signature, document });
        // //         report.reportingRemarks.push(newRemark);
        // //     }
        // // }
        // else {
        //     // 🔄 Check if same user-role AND same formType exists
        //     const index = report.reportingRemarks.findIndex(r =>
        //         r.userId.toString() === userId &&
        //         r.role === role &&
        //         r.documents?.some(doc => doc.formType === formType)
        //     );

        //     if (index !== -1) {
        //         // ✏️ Update existing remark (same formType found)
        //         const existing = report.reportingRemarks[index];
        //         existing.remark = remark;
        //         existing.signature = signature;
        //         existing.date = new Date();
        //         if (document) {
        //             existing.documents = existing.documents || [];
        //             existing.documents.push(document);
        //         }
        //         report.reportingRemarks[index] = existing;
        //     } else {
        //         // ➕ Create a new remark (either role/user combo is new OR formType is different)
        //         const newRemark = createRemark({ userId, role, remark, signature, document });
        //         report.reportingRemarks.push(newRemark);
        //     }
        // }




        if (!report) {
            report = new Report({
                seleMonth,
                ward,
                monthReport: seleMonth,
            });
        }
        
        // 👉 If it's a document type, push directly to report.documents
        if (formType === "document") {
            if (!report.documents) report.documents = [];
            if (document) {
                report.documents.push(document);
            }
        } else {
            // 🔁 For report type, update remarks based on role/user/formType
            const index = report.reportingRemarks.findIndex(r =>
                r.userId.toString() === userId &&
                r.role === role &&
                r.documents?.some(doc => doc.formType === formType)
            );
        
            if (index !== -1) {
                // ✏️ Update existing remark
                const existing = report.reportingRemarks[index];
                existing.remark = remark;
                existing.signature = signature;
                existing.date = new Date();
                if (document) {
                    existing.documents = existing.documents || [];
                    existing.documents.push(document);
                }
                report.reportingRemarks[index] = existing;
            } else {
                // ➕ Add new remark
                const newRemark = createRemark({ userId, role, remark, signature, document });
                report.reportingRemarks.push(newRemark);
            }
        }
        

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
