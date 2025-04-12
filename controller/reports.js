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
        const { userId, remark, role, signature, ward, formType, pdfData, seleMonth } = req.body;
        console.log("🗓️ Selected Month from frontend:", seleMonth);
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
            }
        }
           const createRemark = ({ userId, role, remark, signature, document }) => ({
            userId: new mongoose.Types.ObjectId(userId),
            role,
            remark,
            signature,
            date: new Date(),
            documents: document ? [document] : []
        });
      let report = await Report.findOne({ seleMonth, ward });
         if (!report) {
            report = new Report({
                seleMonth,
                ward,
                monthReport: seleMonth,
            });
        }
           if (formType === "document") {
            if (!report.documents) report.documents = [];
            if (document) {
                report.documents.push(document);
            }
        } else {
             const index = report.reportingRemarks.findIndex(r =>
                r.userId.toString() === userId &&
                r.role === role &&
                r.documents?.some(doc => doc.formType === formType)
            );
             if (index !== -1) {
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
