const mongoose = require('mongoose');
 
const reportSchema = new mongoose.Schema({
  monthReport: { type: String },
  seleMonth: { type: String },
  ward: { type: String },
  // 23-Oct-2026: Energy Expenditure नवीन Head Office flow चे report = "HO" (जुने reports मध्ये हे नसते)
  flow: { type: String },
    reportingRemarks: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          role: { type: String }, 
          roleKey: { type: String },     // 23-Oct-2026: flow मधील step (CLERK_E, JE, SE ...)
          department: { type: String },  // 23-Oct-2026: Clerk चा विभाग
          remark: { type: String }, 
          userWard:{ type: String },
          // signature: { type: String },
                    signature: { type: String },
          // reason: { type: String },      // 24-Oct-2026: Rejected / Send Back चे कारण

                    reason: { type: String },      // 24-Oct-2026: Rejected / Send Back चे कारण
          description: { type: String }, // 24-Oct-2026: Approved चे description
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
                    tokenSerial: { type: String },
                    certSerial: { type: String },
                    signedAt: { type: Date },
                  }
                ],
                lastUpdated: { type: Date },
                // 23-Oct-2026: नवीन flow - प्रत्येक step चा या form वरील निर्णय
                stepStatus: [
                  {
                    roleKey: { type: String },
                    role: { type: String },
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    status: { type: String },   // Approved | Rejected | SentBack
                //     date: { type: Date },
                //   }
                // ],

                                    date: { type: Date },
                //     reason: { type: String },   // 24-Oct-2026: Rejected / Send Back चे कारण
                //   }
                // ],
                                    reason: { type: String },   // 24-Oct-2026: Rejected / Send Back चे कारण
                    description: { type: String },   // 24-Oct-2026: Approved चे description
                    approvalCount: { type: Number, default: 0 }, // 24-Oct-2026: हा step किती वेळा approve झाला
                  }
                ],
                // 24-Oct-2026: प्रत्येक निर्णयाचा इतिहास (कधीही reset होत नाही - नवीन PDF आला तरी)
                decisionHistory: [
                  {
                    roleKey: { type: String },
                    role: { type: String },
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    status: { type: String },        // Approved | Rejected | Returned | SentBack
                    reason: { type: String },
                    description: { type: String },
                    approvalNo: { type: Number },    // Approved असेल तर हे कितवे approval
                    date: { type: Date },
                  }
                // ],
                // doneBy: [


                                ],
                // 27-Oct-2026: कार्यालयीन टिपणी - eOffice प्रमाणे Notings (शेरा + सही), PDF मध्ये "Note # n"
                notings: [
                  {
                    noteNo: { type: Number },
                    roleKey: { type: String },
                    role: { type: String },
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    userName: { type: String },
                    status: { type: String },   // Approved | Rejected | Send Back
                    text: { type: String },     // शेरा (description / reason)
                    image: { type: String },    // uploads/noting_....png (browser मध्ये तयार झालेली)
                    date: { type: Date },
                  }
                ],
                notingCursor: { type: mongoose.Schema.Types.Mixed }, // पुढची note PDF मध्ये कुठे लागेल {page, y}
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

