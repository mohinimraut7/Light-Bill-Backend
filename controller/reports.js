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

// ---------------------------------------------------------------------------------

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
                    approvedBy: []  
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
                documents: []
            };
            
            if (document && role === "Lipik") {
                remarkObj.documents.push(document);
            }

            if (remark === "Approved" && document) {
                document.approvedBy.push(userId);
            }

            if (document && role !== "Lipik") {
                const lipikRemark = report.reportingRemarks.find(r => r.role === "Lipik");

                if (lipikRemark) {
                    lipikRemark.documents = lipikRemark.documents || [];
                    const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);

                    if (mode === "edit") {
                        if (docIndex !== -1) {
                            const existingDoc = lipikRemark.documents[docIndex];
                            const updatedDoc = {
                                ...existingDoc,
                                ...document,
                                uploadedAt: new Date(),
                                signatures: {
                                    ...(existingDoc.signatures || {}),
                                    [role]: signature
                                },
                                approvedBy: existingDoc.approvedBy || []
                            };

                            if (remark === "Approved" && !updatedDoc.approvedBy.includes(userId)) {
                                updatedDoc.approvedBy.push(userId);
                            }

                            lipikRemark.documents[docIndex] = updatedDoc;
                        } else {
                            lipikRemark.documents.push({
                                ...document,
                                uploadedAt: new Date(),
                                signatures: {
                                    [role]: signature
                                },
                                approvedBy: remark === "Approved" ? [userId] : []  
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
                                approvedBy: remark === "Approved" ? [userId] : []  
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

        // Added logic for Junior Engineer and Head Office ward
        if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
            let wardReport = await Report.findOne({ seleMonth, ward: wardName });

            if (!wardReport) {
                return res.status(400).json({
                    message: "The first remark must be from the role 'Lipik'."
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

            if (remark === "Approved") {
                jeRemark.approvedBy = new mongoose.Types.ObjectId(userId);
            }

            const jeExists = wardReport.reportingRemarks.some(r =>
                r.userId.toString() === userId &&
                r.role === "Junior Engineer" &&
                r.remark === remark
            );

            if (!jeExists) {
                if (remark === "Approved") {
                    const lipikRemark = wardReport.reportingRemarks.find(r => r.role === "Lipik");
                    if (lipikRemark && lipikRemark.documents?.length > 0) {
                        const docIndex = lipikRemark.documents.findIndex(doc => doc.formType === formType);
                        if (docIndex !== -1) {
                            const doc = lipikRemark.documents[docIndex];
                            if (!doc.approvedBy.includes(userId)) {
                                doc.approvedBy.push(userId);
                            }
                            lipikRemark.documents[docIndex] = doc;
                        }
                    }
                }

                wardReport.reportingRemarks.push(jeRemark);
                await wardReport.save();
            }

            return res.status(201).json({
                message: `Junior Engineer remark added to ward ${wardName} successfully.`,
                report: wardReport
            });
        }

        // Existing logic for other roles
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


