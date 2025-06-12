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

    //   =============================
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
    
            // console.log("req.body", req.body.wardName);
            // console.log("req.body.signature ***** ", signature);
    
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
    
            if (req.file) {
                document = {
                    formType,
                    formNumber,
                    pdfFile: req.file.path,
                    uploadedAt: new Date(),
                    seleMonth,
                    approvedBy: [] 
                };
            } else if (pdfData) {
                const pdfFilePath = saveBase64File(pdfData, formNumber);
                if (pdfFilePath) {
                    document = {
                        formType,
                        formNumber,
                        pdfFile: pdfFilePath,
                        uploadedAt: new Date(),
                        seleMonth,
                        approvedBy: [] // Empty array initially
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
                    date: new Date()
                };
    
                if (remark === "Approved" && document) {
                    document.approvedBy.push(userId); // Approve the document by adding userId
                }
    
                // 🛠️ NEW - Check for Lipik approval and add approvedBy
                if (document && role !== "Lipik") {
                    const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
    
                    if (lipikRemark) {
                        lipikRemark.documents = lipikRemark.documents || [];
    
                        const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
    
                        if (mode === "edit") {
                            if (docIndex !== -1) {
                                const existingDoc = lipikRemark.documents[docIndex];
                                lipikRemark.documents[docIndex] = {
                                    ...existingDoc,
                                    ...document,
                                    uploadedAt: new Date(),
                                    signatures: {
                                        ...(existingDoc.signatures || {}),
                                        [role]: signature // Add/update the current role's signature
                                    },
                                    approvedBy: existingDoc.approvedBy || [] // Add empty array if no approvals
                                };
                            } else {
                                lipikRemark.documents.push({
                                    ...document,
                                    uploadedAt: new Date(),
                                    signatures: {
                                        [role]: signature
                                    },
                                    approvedBy: [] // Empty array for new document
                                });
                            }
                        } else {
                            const alreadyExists = lipikRemark.documents.some(doc => doc.formType === formType);
                            if (!alreadyExists) {
                                lipikRemark.documents.push({
                                    ...document,
                                    uploadedAt: new Date(),
                                    signatures: {
                                        [role]: signature
                                    },
                                    approvedBy: [] // Empty array for new document
                                });
                            }
                        }
                    } else {
                        return res.status(400).json({
                            message: "Lipik remark not found. Cannot attach document."
                        });
                    }
                }
    
                return remarkObj;
            };
    
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
    
            let report = await Report.findOne({ seleMonth, ward });
    
            if (!report) {
                report = new Report({
                    seleMonth,
                    ward,
                    monthReport: seleMonth,
                });
            }
    
            if (report.reportingRemarks.length === 0 && role !== "Lipik") {
                return res.status(400).json({
                    message: "The first remark must be from the role 'Lipik'."
                });
            }
    
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
                console.log("remark----ttt",remark)
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
    // =======================================================
    // 30 Apr 2025
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
    
    //         // console.log("req.body", req.body.wardName);
    //         // console.log("req.body.signature ***** ",signature);
    
    //        let userWard=ward;
    
    //     //    console.log("userward - 1",userWard)
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
    //                     approvedBy: []  // Empty array initially
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
    //             console.log("document",document)
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
    
    //             console.log("remark test((((((((((((")
    //             if (remark === "Approved" && document) {
    //                 document.approvedBy.push(userId);
    //             }
              
               
    
    // if (document && role !== "Lipik") {
    //     const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");
    
    //     if (lipikRemark) {
    //         lipikRemark.documents = lipikRemark.documents || [];
    
    //         const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
    
    //         if (mode === "edit") {
    //             if (docIndex !== -1) {
    //                 const existingDoc = lipikRemark.documents[docIndex];
    
    //                 // Add/update the current role's signature
    //                 const updatedDoc = {
    //                     ...existingDoc,
    //                     ...document,
    //                     uploadedAt: new Date(),
    //                     signatures: {
    //                         ...(existingDoc.signatures || {}),
    //                         [role]: signature
    //                     },
    //                     // Handle approvedBy logic for the "Approved" remark
    //                     approvedBy: existingDoc.approvedBy || []
    //                 };
    
    //                 // If the remark is "Approved" and the user isn't already in the approvedBy array, add them
    //                 if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
    //                     updatedDoc.approvedBy.push(userId);
    //                 }
    
    //                 lipikRemark.documents[docIndex] = updatedDoc;
    //             } else {
    //                 // If the document doesn't exist, add it
    //                 lipikRemark.documents.push({
    //                     ...document,
    //                     uploadedAt: new Date(),
    //                     signatures: {
    //                         [role]: signature
    //                     },
    //                     approvedBy: remark === "Approved" ? [userId] : []  // Add userId to approvedBy if "Approved"
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
    //                     approvedBy: remark === "Approved" ? [userId] : []  // Add userId to approvedBy if "Approved"
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
            
    //             console.log("userWard -2 ", userWard);
            
    //             // If no report exists, do not create new one if user is not Lipik
    //             if (!wardReport) {
    //                 // Ensure Lipik remark is added first in all new reports
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
    //                 jeRemark.approvedBy=new mongoose.Types.ObjectId(userId);
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
    //                                 doc.approvedBy.push(userId); // ✅ JE approval added to Lipik document
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
//  =============================================   
// 10 Jun 25
// ----------------------


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

// ============================
// 12 jun 2025


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