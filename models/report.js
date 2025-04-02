
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
}, { timestamps: true }); 

module.exports = mongoose.model('Report', reportSchema);
