
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  monthReport: { type: String },
  seleMonth: { type: String },
  ward: { type: String },
    reportingRemarks: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          role: { type: String }, 
          remark: { type: String }, 
          userWard:{ type: String },
          signature: { type: String },
          date: { type: Date, default: Date.now }, 
          documents: [
            {
                formType: { type: String},
                formNumber: { type: String}, 
                pdfFile: { type: String }, 
                uploadedAt: { type: Date, default: Date.now },
                approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
              
            }
        ]
          
          
        }
      ],
      
     
}, { timestamps: true }); 

module.exports = mongoose.model('Report', reportSchema);
