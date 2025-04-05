
// const Report = require('../models/report');
// const mongoose = require("mongoose");
// const axios = require('axios');
// const multer = require('multer'); 
// const path = require('path');

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Save files in 'uploads/' folder
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
//     }
// });

// // ✅ Multer Upload Middleware
// const upload = multer({ storage: storage }).array('pdfFiles', 5); // Allow max 5 PDFs

// // exports.addRemarkReports = async (req, res) => {
// //     try {
// //         console.log("🛠 Incoming request body:", req.body); // Debugging request

// //         const { remark, role, signature, ward } = req.body;

// //         // ✅ Validate required fields
// //         if (!role || !remark) {
// //             console.log("❌ Missing required fields");
// //             return res.status(400).json({ message: "Role and remark are required." });
// //         }

// //         // ✅ Create a new report entry with the remark
// //         const newReport = new Report({
// //             reportingRemarks: [{
// //                 role,
// //                 remark,
// //                 ward,
// //                 signature,
// //                 date: new Date()
// //             }]
// //         });

// //         // ✅ Save the new report in the database
// //         const savedReport = await newReport.save();
// //         console.log("✅ Remark added successfully:", savedReport);

// //         res.status(201).json({
// //             message: "Remark added successfully.",
// //             report: savedReport
// //         });

// //     } catch (error) {
// //         console.error("🚨 Error adding remark:", error);
// //         res.status(500).json({
// //             message: "An error occurred while adding the remark.",
// //             error: error.message
// //         });
// //     }
// // };

// // ------------------------------------------------------------


// // exports.addRemarkReports = async (req, res) => {
// //     try {
// //         upload(req, res, async function (err) {
// //             if (err) {
// //                 console.error("🚨 File Upload Error:", err);
// //                 return res.status(500).json({ message: "File upload failed.", error: err.message });
// //             }

// //             console.log("🛠 Incoming request body:", req.body);
// //             console.log("📂 Uploaded Files:", req.files);

// //             const { remark, role, signature, ward, formType } = req.body;

// //             // ✅ Validate Required Fields
// //             if (!role || !remark || !formType) {
// //                 console.log("❌ Missing required fields");
// //                 return res.status(400).json({ message: "Role, remark, and formType are required." });
// //             }

// //             // ✅ Generate Unique Form Number
// //             const formNumber = generateFormNumber(formType);

// //             // ✅ Prepare Documents Array
// //             let documents = [];
// //             if (req.files && req.files.length > 0) {
// //                 documents = req.files.map(file => ({
// //                     formType,
// //                     formNumber, // Auto-generated unique form number
// //                     pdfFile: file.path, // File path stored in DB
// //                     uploadedAt: new Date()
// //                 }));
// //             }

// //             // ✅ Create a New Report Entry with Remark + Documents
// //             const newReport = new Report({
// //                 reportingRemarks: [{
// //                     role,
// //                     remark,
// //                     ward,
// //                     signature,
// //                     date: new Date()
// //                 }],
// //                 documents // Add uploaded PDFs
// //             });

// //             // ✅ Save the New Report in the Database
// //             const savedReport = await newReport.save();
// //             console.log("✅ Report Added Successfully:", savedReport);

// //             res.status(201).json({
// //                 message: "Report added successfully.",
// //                 report: savedReport
// //             });
// //         });

// //     } catch (error) {
// //         console.error("🚨 Error adding remark & PDFs:", error);
// //         res.status(500).json({
// //             message: "An error occurred while adding the report.",
// //             error: error.message
// //         });
// //     }
// // };
// // ------------------------------------------------------------

// // const saveBase64File = (base64String, formNumber) => {
// //     try {
// //         console.log("🟢 Saving PDF for Form Number:", formNumber);

// //         if (!base64String.startsWith("data:application/pdf;base64,")) {
// //             throw new Error("Invalid PDF Base64 format");
// //         }

// //         const base64Data = base64String.replace(/^data:application\/pdf;base64,/, "");
// //         const pdfBuffer = Buffer.from(base64Data, "base64");
// //         const filePath = path.join(__dirname, "../uploads", `${formNumber}.pdf`);

// //         fs.writeFileSync(filePath, pdfBuffer);
// //         console.log("✅ PDF Saved at:", filePath);

// //         return `/uploads/${formNumber}.pdf`;
// //     } catch (error) {
// //         console.error("❌ Error saving PDF:", error);
// //         return null;
// //     }
// // };



// const generateFormNumber = async (formType) => {
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure 2-digit month
//     const day = String(date.getDate()).padStart(2, '0'); 

//     // Count existing documents to generate a sequence number
//     const count = await Report.countDocuments() + 1;

//     return `${formType}-${year}${month}${day}-${count}`;
// };

// // exports.addRemarkReports = async (req, res) => {
// //     try {
// //         console.log("🛠 Incoming request body:", req.body);
// //         console.log("📂 Uploaded File:", req.file); // ✅ `req.file` वापर (req.files नाही)

// //         const { remark, role, signature, ward, formType } = req.body;

// //         // ✅ Validate Required Fields
// //         // if (!role || !remark || !formType) {
// //         //     console.log("❌ Missing required fields");
// //         //     return res.status(400).json({ message: "Role, remark, and formType are required." });
// //         // }

// //         // ✅ Generate Unique Form Number
// //         const formNumber = generateFormNumber(formType);

// //         // ✅ Prepare Document Object
// //         let document = null;
// //         if (req.file) {
// //             document = {
// //                 formType,
// //                 formNumber, // Auto-generated unique form number
// //                 pdfFile: req.file.path, // File path stored in DB
// //                 uploadedAt: new Date()
// //             };
// //         }

// //         // ✅ Create a New Report Entry with Remark + Document
// //         const newReport = new Report({
// //             reportingRemarks: [{
// //                 role,
// //                 remark,
// //                 ward,
// //                 signature,
// //                 date: new Date()
// //             }],
// //             documents: document ? [document] : [] // Add uploaded PDF if available
// //         });

// //         // ✅ Save the New Report in the Database
// //         const savedReport = await newReport.save();
// //         console.log("✅ Report Added Successfully:", savedReport);

// //         res.status(201).json({
// //             message: "Report added successfully.",
// //             report: savedReport
// //         });

// //     } catch (error) {
// //         console.error("🚨 Error adding remark & PDFs:", error);
// //         res.status(500).json({
// //             message: "An error occurred while adding the report.",
// //             error: error.message
// //         });
// //     }
// // };



// exports.getReports = async (req, res) => {
//     try {
//       const reports = await Report.find();
//       res.status(200).json(reports);
//     } catch (error) {
//       console.error('Error fetching reports:', error);
//       res.status(500).json({ message: 'Internal Server Error' });
//     }
//   };



//   const saveBase64File = (base64String, formNumber) => {
//     try {
//         console.log("🟢 Saving PDF for Form Number:", formNumber);

//         if (!base64String.startsWith("data:application/pdf;base64,")) {
//             throw new Error("Invalid PDF Base64 format");
//         }

//         const base64Data = base64String.replace(/^data:application\/pdf;base64,/, "");
//         const pdfBuffer = Buffer.from(base64Data, "base64");
//         const filePath = path.join(__dirname, "../uploads", `${formNumber}.pdf`);

//         fs.writeFileSync(filePath, pdfBuffer);
//         console.log("✅ PDF Saved at:", filePath);

//         return `/uploads/${formNumber}.pdf`;
//     } catch (error) {
//         console.error("❌ Error saving PDF:", error);
//         return null;
//     }
// };

// // ✅ Add Remark & Upload PDFs
// // exports.addRemarkReports = async (req, res) => {
// //     try {
// //         console.log("🛠 Incoming request body:", req.body);
// //         console.log("📂 Uploaded File:", req.file);

// //         const {userId, remark, role, signature, ward, formType, pdfData } = req.body;

// //         // ✅ Validate Required Fields
// //         if (!role || !remark || !formType) {
// //             return res.status(400).json({ message: "Role, remark, and formType are required." });
// //         }

// //         // ✅ Generate Unique Form Number (USE `await`)
// //         const formNumber = await generateFormNumber(formType);

// //         // ✅ Prepare Document Object
// //         let document = null;
// //         if (req.file) {
// //             // If file is uploaded via multipart/form-data
// //             document = {
// //                 formType,
// //                 formNumber,
// //                 pdfFile: req.file.path,
// //                 uploadedAt: new Date()
// //             };
// //         } else if (pdfData) {
// //             // If Base64 PDF is received
// //             const pdfFilePath = saveBase64File(pdfData, formNumber);
// //             if (pdfFilePath) {
// //                 document = {
// //                     formType,
// //                     formNumber,
// //                     pdfFile: pdfFilePath,
// //                     uploadedAt: new Date()
// //                 };
// //             }
// //         }

// //         // ✅ Create a New Report Entry
// //         const newReport = new Report({
// //             reportingRemarks: [
// //                 {
// //                     userId,
// //                     role,
// //                     remark,
// //                     ward,
// //                     signature,
// //                     date: new Date()
// //                 }
// //             ],
// //             documents: document ? [document] : [] // Add uploaded PDF if available
// //         });

// //         // ✅ Save the Report in MongoDB
// //         const savedReport = await newReport.save();
// //         console.log("✅ Report Added Successfully:", savedReport);

// //         res.status(201).json({
// //             message: "Report added successfully.",
// //             report: savedReport
// //         });

// //     } catch (error) {
// //         console.error("🚨 Error adding remark & PDFs:", error);
// //         res.status(500).json({
// //             message: "An error occurred while adding the report.",
// //             error: error.message
// //         });
// //     }
// // };



// exports.addRemarkReports = async (req, res) => {
//     try {
//         console.log("🛠 Incoming request body:", req.body);
//         console.log("📂 Uploaded File:", req.file);

//         const { userId, remark, role, signature, ward, formType, pdfData } = req.body;

//         // ✅ Validate Required Fields
//         if (!userId || !role || !remark || !formType) {
//             return res.status(400).json({ message: "User ID, role, remark, and formType are required." });
//         }

//         // ✅ Check if `userId` is valid MongoDB ObjectId
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             return res.status(400).json({ message: "Invalid User ID." });
//         }

//         // ✅ Generate Unique Form Number
//         const formNumber = await generateFormNumber(formType);

//         // ✅ Prepare Document Object
//         let document = null;
//         if (req.file) {
//             document = {
//                 formType,
//                 formNumber,
//                 pdfFile: req.file.path,
//                 uploadedAt: new Date()
//             };
//         } else if (pdfData) {
//             const pdfFilePath = saveBase64File(pdfData, formNumber);
//             if (pdfFilePath) {
//                 document = {
//                     formType,
//                     formNumber,
//                     pdfFile: pdfFilePath,
//                     uploadedAt: new Date()
//                 };
//             }
//         }

//         // ✅ Create a New Report Entry
//         const newReport = new Report({
//             reportingRemarks: [
//                 {
//                     userId: new mongoose.Types.ObjectId(userId), // ✅ Ensure ObjectId format
//                     role,
//                     remark,
//                     ward,
//                     signature,
//                     date: new Date()
//                 }
//             ],
//             documents: document ? [document] : []
//         });

//         // ✅ Save the Report in MongoDB
//         const savedReport = await newReport.save();
//         console.log("✅ Report Added Successfully:", savedReport);

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
// ====================================================================================



const Report = require('../models/report');
const mongoose = require("mongoose");
const axios = require('axios');
const multer = require('multer'); 
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in 'uploads/' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});


const upload = multer({ storage: storage }).array('pdfFiles', 5); // Allow max 5 PDFs

const generateFormNumber = async (formType) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure 2-digit month
    const day = String(date.getDate()).padStart(2, '0'); 

    // Count existing documents to generate a sequence number
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

// ✅ Add Remark & Upload PDFs
exports.addRemarkReports = async (req, res) => {
    try {
        console.log("🛠 Incoming request body:", req.body);
        console.log("📂 Uploaded File:", req.file);

        const { remark, role, signature, ward, formType, pdfData } = req.body;

        // ✅ Validate Required Fields
        if (!role || !remark || !formType) {
            return res.status(400).json({ message: "Role, remark, and formType are required." });
        }

        // ✅ Generate Unique Form Number (USE `await`)
        const formNumber = await generateFormNumber(formType);

        // ✅ Prepare Document Object
        let document = null;
        if (req.file) {
            // If file is uploaded via multipart/form-data
            document = {
                formType,
                formNumber,
                pdfFile: req.file.path,
                uploadedAt: new Date()
            };
        } else if (pdfData) {
            // If Base64 PDF is received
            const pdfFilePath = saveBase64File(pdfData, formNumber);
            if (pdfFilePath) {
                document = {
                    formType,
                    formNumber,
                    pdfFile: pdfFilePath,
                    uploadedAt: new Date()
                };
            }
        }

        // ✅ Create a New Report Entry
        const newReport = new Report({
            reportingRemarks: [
                {
                    role,
                    remark,
                    ward,
                    signature,
                    date: new Date()
                }
            ],
            documents: document ? [document] : [] // Add uploaded PDF if available
        });

        // ✅ Save the Report in MongoDB
        const savedReport = await newReport.save();
        console.log("✅ Report Added Successfully:", savedReport);

        res.status(201).json({
            message: "Report added successfully.",
            report: savedReport
        });

    } catch (error) {
        console.error("🚨 Error adding remark & PDFs:", error);
        res.status(500).json({
            message: "An error occurred while adding the report.",
            error: error.message
        });
    }
};
