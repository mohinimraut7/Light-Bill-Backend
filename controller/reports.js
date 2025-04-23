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

        console.log("req.body", req.body.wardName);

       
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

      
        const createRemark = ({ userId,ward,role, remark, signature, document }) => {
            const remarkObj = {
                userId: new mongoose.Types.ObjectId(userId),
                ward,
                role,
                remark,
                signature,
                date: new Date()
            };

          
            if (role === "Lipik") {
                remarkObj.documents = document ? [document] : [];
            }

            return remarkObj;
        };

      
        if (role === "Junior Engineer" && ward === "Head Office" && wardName) {
            let wardReport = await Report.findOne({ seleMonth, ward: wardName });

            if (!wardReport) {
                wardReport = new Report({
                    seleMonth,
                    userWard:ward,
                    ward: wardName,
                    monthReport: seleMonth,
                });
            }

            const jeRemark = {
                userId: new mongoose.Types.ObjectId(userId),
                role: "Junior Engineer",
                ward,
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
            const newRemark = createRemark({ userId, role,ward,remark, signature, document });
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


