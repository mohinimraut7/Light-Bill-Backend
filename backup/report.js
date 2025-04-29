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

// ========================================================
// new

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

//         console.log("req.body", req.body.wardName);

       
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

      
//         const createRemark = ({ userId,ward,role, remark, signature, document }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 date: new Date()
//             };

          
//             // if (role === "Lipik") {
//             //     remarkObj.documents = document ? [document] : [];
//             // }
// // -------------------------------------------------------------------

//             // if (document && role !== "Lipik") {
//             //     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
            
//             //     if (lipikRemark) {
//             //         lipikRemark.documents = lipikRemark.documents || [];
            
//             //         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
            
//             //         if (mode === "edit") {
//             //             if (docIndex !== -1) {
//             //                 lipikRemark.documents[docIndex] = document;
//             //             } else {
//             //                 lipikRemark.documents.push(document);
//             //             }
//             //         } else {
//             //             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//             //             if (!alreadyExists) {
//             //                 lipikRemark.documents.push(document);
//             //             }
//             //         }
//             //     } else {
//             //         return res.status(400).json({
//             //             message: "Lipik remark not found. Cannot attach document."
//             //         });
//             //     }
//             // }
            
// // -------------------------------------------------------------

// // if (document && role !== "Lipik") {
// //     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

// //     if (lipikRemark) {
// //         lipikRemark.documents = lipikRemark.documents || [];

// //         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

// //         if (mode === "edit") {
// //             if (docIndex !== -1) {
// //                 // Overwrite only specific fields, preserve others
// //                 lipikRemark.documents[docIndex] = {
// //                     ...lipikRemark.documents[docIndex],
// //                     ...document,
// //                     uploadedAt: new Date()  // optionally update the timestamp
// //                 };
// //             } else {
// //                 lipikRemark.documents.push(document);
// //             }
// //         } else {
// //             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
// //             if (!alreadyExists) {
// //                 lipikRemark.documents.push(document);
// //             }
// //         }
// //     } else {
// //         return res.status(400).json({
// //             message: "Lipik remark not found. Cannot attach document."
// //         });
// //     }
// // }
// // -------------------------------------------
// if (document && role !== "Lipik") {
//     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//     if (lipikRemark) {
//         lipikRemark.documents = lipikRemark.documents || [];

//         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//         if (mode === "edit") {
//             if (docIndex !== -1) {
//                 const existingDoc = lipikRemark.documents[docIndex];

//                 lipikRemark.documents[docIndex] = {
//                     ...existingDoc,
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         ...(existingDoc.signatures || {}),
//                         [role]: signature  // Add/update the current role's signature
//                     }
//                 };
//             } else {
//                 lipikRemark.documents.push({
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         [role]: signature
//                     }
//                 });
//             }
//         } else {
//             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//             if (!alreadyExists) {
//                 lipikRemark.documents.push({
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         [role]: signature
//                     }
//                 });
//             }
//         }
//     } else {
//         return res.status(400).json({
//             message: "Lipik remark not found. Cannot attach document."
//         });
//     }
// }


//             return remarkObj;
//         };

      
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });

//             if (!wardReport) {
//                 wardReport = new Report({
//                     seleMonth,
//                     userWard:ward,
//                     ward: wardName,
//                     monthReport: seleMonth,
//                 });
//             }

//             const jeRemark = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 role: "Junior Engineer",
//                 ward,
//                 remark,
//                 signature,
//                 date: new Date(),
//             };

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.remark === remark
//             );

//             if (!jeExists) {
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

      
//         // if (report.reportingRemarks.length === 0 && role !== "Lipik") {
//         //     return res.status(400).json({
//         //         message: "The first remark must be from the role 'Lipik'."
//         //     });
//         // }

//         // ------------------------------------------------------------------------
//         if (report.reportingRemarks.length === 0) {
//             // First remark must be from Lipik (specific ward)
//             if (role !== "Lipik") {
//                 return res.status(400).json({
//                     message: "The first remark must be from the role 'Lipik'."
//                 });
//             }
//         } 
//         else if (report.reportingRemarks.length === 1) {
//             const firstRemark = report.reportingRemarks[0];
        
//             // Second remark must be from Junior Engineer (allowed wards only, not Head Office)
//             const allowedWardsForJuniorEngineer = ["Ward-A", "Ward-B", "Ward-C", "Ward-D", "Ward-E", "Ward-F", "Ward-G", "Ward-H", "Ward-I"];
        
//             if (role !== "Junior Engineer") {
//                 return res.status(400).json({
//                     message: "The second remark must be from the role 'Junior Engineer'."
//                 });
//             }
//             if (!allowedWardsForJuniorEngineer.includes(ward)) {
//                 return res.status(400).json({
//                     message: "Junior Engineer must belong to one of the allowed wards (Ward-A to Ward-I)."
//                 });
//             }
//             if (ward !== firstRemark.ward) {
//                 return res.status(400).json({
//                     message: `Junior Engineer's ward must be same as Lipik's ward ('${firstRemark.ward}').`
//                 });
//             }
//         }
//         else if (report.reportingRemarks.length === 2) {
//             const secondRemark = report.reportingRemarks[1];
        
//             // Third remark must be from Junior Engineer (Head Office only)
//             if (role !== "Junior Engineer" || ward !== "Head Office") {
//                 return res.status(400).json({
//                     message: "The third remark must be from the role 'Junior Engineer' from 'Head Office'."
//                 });
//             }
//         }
//         else if (report.reportingRemarks.length === 3) {
//             const thirdRemark = report.reportingRemarks[2];
        
//             // Fourth remark must be from Accountant
//             if (role !== "Accountant") {
//                 return res.status(400).json({
//                     message: "The fourth remark must be from the role 'Accountant'."
//                 });
//             }
        
//             // Accountant must match Junior Engineer (Head Office) ward
//             if (ward !== thirdRemark.ward) {
//                 return res.status(400).json({
//                     message: `Accountant must belong to same ward as Junior Engineer from Head Office ('${thirdRemark.ward}').`
//                 });
//             }
//         }
//         else if (report.reportingRemarks.length === 4) {
//             const fourthRemark = report.reportingRemarks[3];
        
//             // Fifth remark must be from Assistant Municipal Commissioner
//             if (role !== "Assistant Municipal Commissioner") {
//                 return res.status(400).json({
//                     message: "The fifth remark must be from the role 'Assistant Municipal Commissioner'."
//                 });
//             }
        
//             if (ward !== fourthRemark.ward) {
//                 return res.status(400).json({
//                     message: `Assistant Municipal Commissioner must belong to same ward as Accountant ('${fourthRemark.ward}').`
//                 });
//             }
//         }
//         else if (report.reportingRemarks.length === 5) {
//             const fifthRemark = report.reportingRemarks[4];
        
//             // Sixth remark must be from Dy. Municipal Commissioner
//             if (role !== "Dy. Municipal Commissioner") {
//                 return res.status(400).json({
//                     message: "The sixth remark must be from the role 'Dy. Municipal Commissioner'."
//                 });
//             }
        
//             if (ward !== fifthRemark.ward) {
//                 return res.status(400).json({
//                     message: `Dy. Municipal Commissioner must belong to same ward as Assistant Municipal Commissioner ('${fifthRemark.ward}').`
//                 });
//             }
//         }
//         else {
//             return res.status(400).json({
//                 message: "Invalid number of remarks or roles."
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
//             const newRemark = createRemark({ userId, role,ward,remark, signature, document });
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
// ======================================
// old



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

//         console.log("req.body", req.body.wardName);

//        let userWard=ward;

//        console.log("userward - 1",userWard)
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

      
//         const createRemark = ({ userId,ward,role, remark, signature, document,userWard }) => {
//             const remarkObj = {
//                 userId: new mongoose.Types.ObjectId(userId),
//                 ward,
//                 role,
//                 remark,
//                 signature,
//                 userWard,
//                 date: new Date()
//             };

          
//             // if (role === "Lipik") {
//             //     remarkObj.documents = document ? [document] : [];
//             // }
// // -------------------------------------------------------------------

//             // if (document && role !== "Lipik") {
//             //     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
            
//             //     if (lipikRemark) {
//             //         lipikRemark.documents = lipikRemark.documents || [];
            
//             //         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
            
//             //         if (mode === "edit") {
//             //             if (docIndex !== -1) {
//             //                 lipikRemark.documents[docIndex] = document;
//             //             } else {
//             //                 lipikRemark.documents.push(document);
//             //             }
//             //         } else {
//             //             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//             //             if (!alreadyExists) {
//             //                 lipikRemark.documents.push(document);
//             //             }
//             //         }
//             //     } else {
//             //         return res.status(400).json({
//             //             message: "Lipik remark not found. Cannot attach document."
//             //         });
//             //     }
//             // }
            
// // -------------------------------------------------------------

// // if (document && role !== "Lipik") {
// //     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

// //     if (lipikRemark) {
// //         lipikRemark.documents = lipikRemark.documents || [];

// //         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

// //         if (mode === "edit") {
// //             if (docIndex !== -1) {
// //                 // Overwrite only specific fields, preserve others
// //                 lipikRemark.documents[docIndex] = {
// //                     ...lipikRemark.documents[docIndex],
// //                     ...document,
// //                     uploadedAt: new Date()  // optionally update the timestamp
// //                 };
// //             } else {
// //                 lipikRemark.documents.push(document);
// //             }
// //         } else {
// //             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
// //             if (!alreadyExists) {
// //                 lipikRemark.documents.push(document);
// //             }
// //         }
// //     } else {
// //         return res.status(400).json({
// //             message: "Lipik remark not found. Cannot attach document."
// //         });
// //     }
// // }
// // -------------------------------------------
// if (document && role !== "Lipik") {
//     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//     if (lipikRemark) {
//         lipikRemark.documents = lipikRemark.documents || [];

//         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//         if (mode === "edit") {
//             if (docIndex !== -1) {
//                 const existingDoc = lipikRemark.documents[docIndex];

//                 lipikRemark.documents[docIndex] = {
//                     ...existingDoc,
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         ...(existingDoc.signatures || {}),
//                         [role]: signature  // Add/update the current role's signature
//                     }
//                 };
//             } else {
//                 lipikRemark.documents.push({
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         [role]: signature
//                     }
//                 });
//             }
//         } else {
//             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//             if (!alreadyExists) {
//                 lipikRemark.documents.push({
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         [role]: signature
//                     }
//                 });
//             }
//         }
//     } else {
//         return res.status(400).json({
//             message: "Lipik remark not found. Cannot attach document."
//         });
//     }
// }


//             return remarkObj;
//         };

      
//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });
//                console.log("userWard -2 ",userWard)
//             if (!wardReport) {
//                 wardReport = new Report({
//                     seleMonth,
//                     userWard,
//                     ward: wardName,
//                     monthReport: seleMonth,
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

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.remark === remark
//             );

//             if (!jeExists) {
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
//             const newRemark = createRemark({ userId, role,ward,remark, signature, document,userWard });
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

// =======================================================================================================



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

//         console.log("req.body", req.body.wardName);

//         let userWard = ward;

//         console.log("userward - 1", userWard);
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
//                 documents: document ? [document] : []  // Initialize documents with the provided document
//             };

//             return remarkObj;
//         };

//         if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
//             let wardReport = await Report.findOne({ seleMonth, ward: wardName });
//             console.log("userWard -2 ", userWard);
//             if (!wardReport) {
//                 wardReport = new Report({
//                     seleMonth,
//                     userWard,
//                     ward: wardName,
//                     monthReport: seleMonth,
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

//             const jeExists = wardReport.reportingRemarks.some(r =>
//                 r.userId.toString() === userId &&
//                 r.role === "Junior Engineer" &&
//                 r.remark === remark
//             );

//             if (!jeExists) {
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

//         // Ensure Lipik's remark has documents initialized
//         if (role === "Lipik" && report.reportingRemarks.length === 0) {
//             // Initialize documents for the first Lipik remark
//             const lipikRemark = createRemark({ userId, ward, role, remark, signature, document, userWard });
//             report.reportingRemarks.push(lipikRemark);
//             await report.save();
//             return res.status(201).json({
//                 message: "First Lipik remark added with document.",
//                 report
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

// =================================================================================
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
            wardName,
            mode
        } = req.body;

        console.log("req.body", req.body);

        let userWard = ward;

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
        let document = null;

        // Handling file upload
        if (req.file) {
            document = {
                formType,
                formNumber,
                pdfFile: req.file.path,
                uploadedAt: new Date(),
                seleMonth
            };
        } else if (pdfData) {
            // Handling base64 PDF data
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

        const createRemark = ({ userId, ward, role, remark, signature, document, userWard }) => {
            const remarkObj = {
                userId: new mongoose.Types.ObjectId(userId),
                ward,
                role,
                remark,
                signature,
                userWard,
                date: new Date(),
                documents: document ? [document] : []  // Initialize documents with the provided document
            };

            return remarkObj;
        };

        // Check if it's the first remark for the 'Lipik' role
        if (role === "Lipik" && !req.file && !pdfData) {
            return res.status(400).json({
                message: "Documents are required for the Lipik role."
            });
        }

        // Handle Junior Engineer specific report
        if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
            let wardReport = await Report.findOne({ seleMonth, ward: wardName });
            if (!wardReport) {
                wardReport = new Report({
                    seleMonth,
                    userWard,
                    ward: wardName,
                    monthReport: seleMonth,
                });
            }

            const jeRemark = {
                userId: new mongoose.Types.ObjectId(userId),
                role: "Junior Engineer",
                ward,
                userWard,
                remark,
                signature,
                date: new Date(),
            };

            const jeExists = wardReport.reportingRemarks.some(r =>
                r.userId.toString() === userId &&
                r.role === "Junior Engineer" &&
                r.remark === remark
            );

            if (!jeExists) {
                wardReport.reportingRemarks.push(jeRemark);
                await wardReport.save();
            }

            return res.status(201).json({
                message: `Junior Engineer remark added to ward ${wardName} successfully.`,
                report: wardReport
            });
        }

        // Ensure report exists or create new one
        let report = await Report.findOne({ seleMonth, ward });

        if (!report) {
            report = new Report({
                seleMonth,
                ward,
                monthReport: seleMonth,
            });
        }

        // Ensure Lipik's remark has documents initialized
        if (role === "Lipik" && report.reportingRemarks.length === 0) {
            const lipikRemark = createRemark({ userId, ward, role, remark, signature, document, userWard });
            report.reportingRemarks.push(lipikRemark);
            await report.save();
            return res.status(201).json({
                message: "First Lipik remark added with document.",
                report
            });
        }

        // Check if first remark is from Lipik
        if (report.reportingRemarks.length === 0 && role !== "Lipik") {
            return res.status(400).json({
                message: "The first remark must be from the role 'Lipik'."
            });
        }

        // Find or add remarks
        const index = report.reportingRemarks.findIndex(r =>
            r.userId.toString() === userId &&
            r.role === role &&
            report.ward === ward
        );

        if (index !== -1) {
            const existing = report.reportingRemarks[index];
            existing.remark = remark;
            existing.signature = signature;
            existing.date = new Date();
            existing.documents = existing.documents || [];

            const docIndex = existing.documents.findIndex(doc => doc.formType === formType);

            if (mode === "edit") {
                if (docIndex !== -1) {
                    existing.documents[docIndex] = document;
                } else {
                    existing.documents.push(document);
                }
            } else {
                const alreadyExists = existing.documents.some(doc => doc.formType === formType);
                if (!alreadyExists && document) {
                    existing.documents.push(document);
                }
            }

            report.reportingRemarks[index] = existing;
        } else {
            const newRemark = createRemark({ userId, role, ward, remark, signature, document, userWard });
            report.reportingRemarks.push(newRemark);
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
// =================================================================================================
// 29 April 2025

// if (document && role !== "Lipik")
//     {
//     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//     if (lipikRemark) {
//         lipikRemark.documents = lipikRemark.documents || [];

//         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

//         if (mode === "edit") {
//             if (docIndex !== -1) {
//                 const existingDoc = lipikRemark.documents[docIndex];

//                 lipikRemark.documents[docIndex] = {
//                     ...existingDoc,
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         ...(existingDoc.signatures || {}),
//                         [role]: signature  // Add/update the current role's signature
//                     },
//                     approvedBy: existingDoc.approvedBy || [] // ✅ very important
//                 };
//             } 
            
            
            
//             else {
//                 lipikRemark.documents.push({
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         [role]: signature
//                     },
//                     approvedBy: []
//                 });
//             }
//         } else {
//             const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
//             if (!alreadyExists) {
//                 lipikRemark.documents.push({
//                     ...document,
//                     uploadedAt: new Date(),
//                     signatures: {
//                         [role]: signature
//                     },
//                     approvedBy: []
//                 });
//             }
//         }
//     } else {
//         return res.status(400).json({
//             message: "Lipik remark not found. Cannot attach document."
//         });
//     }
// }

// Handling the logic when role is not "Lipik"
// ---------------------------------------------------------------
// if (document && role !== "Lipik") {
//     // Finding the remark for "Lipik"
//     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

//     // Check if Lipik's remark exists
//     if (lipikRemark) {
//         // Find the document inside Lipik's remark based on formType and formNumber
//         const docIndex = lipikRemark.documents.findIndex(
//             doc => doc.formType === formType && doc.formNumber === document.formNumber
//         );

//         // If the document exists, update it
//         if (docIndex !== -1) {
//             const existingDoc = lipikRemark.documents[docIndex];

//             // Add user to the approvedBy array if the remark is "Approved"
//             if (remark === "Approved" && !existingDoc.approvedBy.includes(userId)) {
//                 existingDoc.approvedBy.push(userId);
//             }

//             // Update signatures with the current role's signature
//             existingDoc.signatures = {
//                 ...(existingDoc.signatures || {}),
//                 [role]: signature
//             };

//             // Update the document in the array
//             lipikRemark.documents[docIndex] = {
//                 ...existingDoc,
//                 uploadedAt: new Date()  // Update upload time
//             };
//         } else {
//             // If document is not found, add it
//             lipikRemark.documents.push({
//                 ...document,
//                 uploadedAt: new Date(),
//                 signatures: {
//                     [role]: signature
//                 },
//                 approvedBy: remark === "Approved" ? [userId] : [] // Add userId to approvedBy if "Approved"
//             });
//         }
//     } else {
//         // If Lipik remark doesn't exist, return an error
//         return res.status(400).json({
//             message: "Lipik remark not found. Cannot attach document."
//         });
//     }
// }
// ------------------------------------------------

// ===============================================================================

// if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
        //     let wardReport = await Report.findOne({ seleMonth, ward: wardName });
        //        console.log("userWard -2 ",userWard)
        //     if (!wardReport) {
        //         wardReport = new Report({
        //             seleMonth,
        //             userWard,
        //             ward: wardName,
        //             monthReport: seleMonth,
        //         });
        //     }

        //     const jeRemark = {
        //         userId: new mongoose.Types.ObjectId(userId),
        //         role: "Junior Engineer",
        //         ward,
        //         userWard,
        //         remark,
        //         signature,
        //         date: new Date(),
        //     };

        //     const jeExists = wardReport.reportingRemarks.some(r =>
        //         r.userId.toString() === userId &&
        //         r.role === "Junior Engineer" &&
        //         r.remark === remark
        //     );

        //     if (!jeExists) {
        //         wardReport.reportingRemarks.push(jeRemark);
        //         await wardReport.save();
        //     }

        //     return res.status(201).json({
        //         message: `Junior Engineer remark added to ward ${wardName} successfully.`,
        //         report: wardReport
        //     });
        // }
// =================================================================================================
        // if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
        //     let wardReport = await Report.findOne({ seleMonth, ward: wardName });
        //        console.log("userWard -2 ",userWard)
        //     if (!wardReport) {
        //         wardReport = new Report({
        //             seleMonth,
        //             userWard,
        //             ward: wardName,
        //             monthReport: seleMonth,
        //         });
        //     }

        //     const jeRemark = {
        //         userId: new mongoose.Types.ObjectId(userId),
        //         role: "Junior Engineer",
        //         ward,
        //         userWard,
        //         remark,
        //         signature,
        //         date: new Date(),
        //     };

        //     const jeExists = wardReport.reportingRemarks.some(r =>
        //         r.userId.toString() === userId &&
        //         r.role === "Junior Engineer" &&
        //         r.remark === remark
        //     );

        //     if (!jeExists) {
        //         wardReport.reportingRemarks.push(jeRemark);
        //         await wardReport.save();
        //     }

        //     return res.status(201).json({
        //         message: `Junior Engineer remark added to ward ${wardName} successfully.`,
        //         report: wardReport
        //     });
        // }

      
        



        // ==========================