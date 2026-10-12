
// const mongoose = require('mongoose');

// const reportSchema = new mongoose.Schema({
//   monthReport: { type: String },
//   seleMonth: { type: String },
//   ward: { type: String },
//     reportingRemarks: [
//         {
//           userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//           role: { type: String }, 
//           remark: { type: String }, 
//           userWard:{ type: String },
//           signature: { type: String },
//           date: { type: Date, default: Date.now }, 
//           documents: [
//             {
//                 formType: { type: String},
//                 formNumber: { type: String}, 
//                 pdfFile: { type: String }, 
//                 uploadedAt: { type: Date, default: Date.now },
//                 approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//                 doneBy: [
//       {
//         formType: { type: String },
//         userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         role: { type: String },
//         status: { type: String },
//         ward: { type: String },
//         userWard: { type: String }
//       }
//     ]
              
//             }
//         ]
          
          
//         }
//       ],
      
     
// }, { timestamps: true }); 

// module.exports = mongoose.model('Report', reportSchema);





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
                approvedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
                // Digital Signature: सही कुठे लावायची { LIPIK: {page, box:[x1,y1,x2,y2]}, ... }
                signatureSlots: { type: mongoose.Schema.Types.Mixed },
                // कोणत्या roles चे DSC PDF मध्ये लागले आहेत
                signedRoles: [
                  {
                    roleKey: { type: String },
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    signerName: { type: String },
                    signedAt: { type: Date },
                  }
                ],
                lastUpdated: { type: Date },
                doneBy: [
      {
        formType: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String },
        status: { type: String },
        ward: { type: String },
        userWard: { type: String }
      }
    ]
              
            }
        ]
          
          
        }
      ],
      
     
}, { timestamps: true }); 

module.exports = mongoose.model('Report', reportSchema);

