
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportingRemarks: [
        {
          role: { type: String }, // Example: "Super Admin", "Junior Engineer"
          remark: { type: String }, // Example: "Checked meter status"
          ward: { type: String },
          signature: { type: String },
          date: { type: Date, default: Date.now } // Timestamp of remark
        }
      ],
      documents: [
        {
            formType: { type: String}, // Example: "Form-22", "Karyalayin Tipani"
            formNumber: { type: String}, // Unique ID for each form
            pdfFile: { type: String }, // PDF file stored as Base64 or File Path
            uploadedAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true }); 

module.exports = mongoose.model('Report', reportSchema);
