
// const mongoose = require("mongoose");

// const todayDate = new Date().toISOString().split("T")[0]; 

// const billSchema = new mongoose.Schema(
//   {
//       consumerNumber: {
//         type: String,
//         trim: true,
//       },

//       consumerName: {
//         type: String,
//       },
//       consumerAddress: {
//         type: String,
//       },
      
//       contactNumber: {
//         type: String,
//         required: true,
//       },
//       ward: {
//         type: String, 
//         trim: true,
//       },
//       adjustmentUnit: {
//         type: Number,
//         required: true,
//       },
//       totalConsumption: {
//         type: Number,
//         required: true,
//       },
//       installationDate: {
//         type: String,
//       },
    
//       tariffDescription: {
//         type: String,
//       },
//       meterNumber: {
//         type: String,
//         required: true,
//       },
  
//       meterStatus: {
//         type: String,
//         trim: true,
//         required: true,
//       },
//       phaseType: {
//         type: String,
//     },
     
    
//       billingUnit: {
//         type: String,
//         required: true,
//       },
//       netLoad: {
//         type: String,
//         required: true,
//       },
//       sanctionedLoad: {
//         type: String,
//       },
//       billDate: {
//         type: String,
//         required: true,
//       },
//       billType: {
//         type: String,
//       },
//       billDisplayParameter1:{
//         type: String,
//       },
//       billDisplayParameter2:{
//         type: String,
//       },
//       billDisplayParameter3:{
//         type: String,
//       },
//       billDisplayParameter4:{
//         type: String,
//       },
//       billNo: {
//         type: String,
//         required: true,
//       },
//       monthAndYear: {
//         type: String,
//         required: true,
//       },
//       previousReadingDate: {
//         type: String,
//         required: true,
//       },
//       previousReading: {
//         type: Number,
//         required: true,
//     },
//     currentReadingDate: {
//       type: String, 
//       required: true,
//     },
//     currentReading: {
//       type: Number,
//       required: true,
//     },
    
//     netBillAmount: {
//       type: Number,
//       required: true,
//     },
//     paymentStatus: { type: String, trim: true, lowercase: true },
//     approvedStatus: {
//       type: String,
//     },
//     lastReceiptAmount: {
//       type: Number,
//     },
    
//     lastReceiptDate: {
//       type: String,
//     },
//     billPaymentDate: {
//       type: String,
//     },
//     paidAmount: {
//       type: Number,
//     },
//     promptPaymentDate: {
//       type: String,
//       required: true,
//     },
//     promptPaymentAmount: {
//       type: Number,
//       required: true,
//     },
//     dueDate: {
//       type: String, 
//       required: true,
//     },
//     netBillAmountWithDPC: {
//       type: Number,
//       required: true,
//     },
//     dueAlert: {
//       type: Boolean,
//       default: false,
//     },
//     overdueAlert: {
//       type: Boolean,
//       default: false,
//     },
//       receiptNoBillPayment:{
//       type: String, 
//     },
//     juniorEngineerContactNumber: {
//       type: Number,
//     },
    
//     remarks: [
//       {
//         role: { type: String, required: true }, 
//         remark: { type: String, required: true }, 
//         ward: { type: String },
//         signature: {type: String, 
//           required: false},
//         date: { type: Date, default: Date.now } 
//       }
//     ],
    
//   },
//   { timestamps: true }
// );

// billSchema.pre('save', function (next) {
//   if (this.dueDate && this.paymentStatus === "unpaid") {
//     const today = new Date().toISOString().split("T")[0]; 
//     const dueDate = new Date(this.dueDate);
    
   
//     dueDate.setDate(dueDate.getDate() - 2);
//     const twoDaysBeforeDue = dueDate.toISOString().split("T")[0];

   
//     this.dueAlert = today === twoDaysBeforeDue;
//   } else {
//     this.dueAlert = false;
//   }

//   if (this.paymentStatus) {
//     this.paymentStatus = this.paymentStatus.toLowerCase().trim();
//   }

//   next();
// });



// module.exports = mongoose.model("Bill", billSchema);









// -------------------------------------------------------






const mongoose = require("mongoose");

const todayDate = new Date().toISOString().split("T")[0]; 

const billSchema = new mongoose.Schema(
  {
      consumerNumber: {
        type: String,
        trim: true,
      },

      consumerName: {
        type: String,
      },
      consumerAddress: {
        type: String,
      },
      
      contactNumber: {
        type: String,
        required: true,
      },
      ward: {
        type: String, 
        trim: true,
      },
      adjustmentUnit: {
        type: Number,
        required: true,
      },
      totalConsumption: {
        type: Number,
        required: true,
      },
      installationDate: {
        type: String,
      },
    
      tariffDescription: {
        type: String,
      },
      meterNumber: {
        type: String,
        required: true,
      },
  
      meterStatus: {
        type: String,
        trim: true,
        required: true,
      },
      phaseType: {
        type: String,
    },
     
    
      billingUnit: {
        type: String,
        required: true,
      },
      netLoad: {
        type: String,
        required: true,
      },
      sanctionedLoad: {
        type: String,
      },
      billDate: {
        type: String,
        required: true,
      },
      billType: {
        type: String,
      },
      billDisplayParameter1:{
        type: String,
      },
      billDisplayParameter2:{
        type: String,
      },
      billDisplayParameter3:{
        type: String,
      },
      billDisplayParameter4:{
        type: String,
      },
      billNo: {
        type: String,
        required: true,
      },
      monthAndYear: {
        type: String,
        required: true,
      },
      previousReadingDate: {
        type: String,
        required: true,
      },
      previousReading: {
        type: Number,
        required: true,
    },
    currentReadingDate: {
      type: String, 
      required: true,
    },
    currentReading: {
      type: Number,
      required: true,
    },
    
    netBillAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: { type: String, trim: true, lowercase: true },
    approvedStatus: {
      type: String,
    },
    lastReceiptAmount: {
      type: Number,
    },
    
    lastReceiptDate: {
      type: String,
    },
    billPaymentDate: {
      type: String,
    },
    paidAmount: {
      type: Number,
    },
    promptPaymentDate: {
      type: String,
      required: true,
    },
    promptPaymentAmount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: String, 
      required: true,
    },
    netBillAmountWithDPC: {
      type: Number,
      required: true,
    },
    dueAlert: {
      type: Boolean,
      default: false,
    },
    overdueAlert: {
      type: Boolean,
      default: false,
    },
      receiptNoBillPayment:{
      type: String, 
    },
    juniorEngineerContactNumber: {
      type: Number,
    },
    
    remarks: [
      {
        role: { type: String, required: true }, 
        remark: { type: String, required: true }, 
        ward: { type: String },
        signature: {type: String, 
          required: false},
        date: { type: Date, default: Date.now } 
      }
    ],
    
  },
  { timestamps: true }
);

billSchema.pre('save', function (next) {
  if (this.dueDate && this.paymentStatus === "unpaid") {
    const today = new Date().toISOString().split("T")[0]; 
    const dueDate = new Date(this.dueDate);
    
   
    dueDate.setDate(dueDate.getDate() - 2);
    const twoDaysBeforeDue = dueDate.toISOString().split("T")[0];

   
    this.dueAlert = today === twoDaysBeforeDue;
  } else {
    this.dueAlert = false;
  }

  if (this.paymentStatus) {
    this.paymentStatus = this.paymentStatus.toLowerCase().trim();
  }

  next();
});



// ─── PERFORMANCE INDEXES (3-Oct-2026) ─────────────────────────────────────────
// आधी bills collection वर एकही index नव्हता → प्रत्येक getBills / getBillsOverdue /
// getConsumers query पूर्ण collection scan + memory मध्ये sort करत होती.
// हे indexes फक्त वाचन fast करतात; data किंवा logic मध्ये काहीही बदल नाही.
// Server restart केल्यावर Mongoose हे indexes आपोआप एकदाच build करतो.
billSchema.index({ createdAt: -1 });                               // getBills default sort
billSchema.index({ monthAndYear: 1, createdAt: -1 });              // month filter + sort
billSchema.index({ ward: 1, monthAndYear: 1, createdAt: -1 });     // ward + month filter + sort
billSchema.index({ consumerNumber: 1 });                           // consumer search / getConsumers meterNumber lookup
billSchema.index({ paymentStatus: 1, dueDate: 1 });                // overdue bills + cron dueAlert jobs

module.exports = mongoose.model("Bill", billSchema);

