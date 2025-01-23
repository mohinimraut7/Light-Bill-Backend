  // const mongoose = require("mongoose");
  // const billSchema = new mongoose.Schema(
  //   {
     
  //     consumerNumber:{
  //       type: String,
  //       trim: true,  
  //     },
  //     email: {
  //       type: String,
  //       required: true,
  //       trim: true,
  //     },
  //     consumerName: {
  //       type: String,
  //   },
  //    consumerAddress: {
  //       type: String,
  //   },
  //   contactNumber: {
  //     type: Number,
  //     required: true,
  //     validate: {
  //       validator: function(v) {
  //         return /^\d{10}$/.test(v.toString());
  //       },
  //       message: "Contact number must be a 10-digit number"
  //     }
  //   },
     
  //     ward: {
  //       type: String,
  //       trim: true,
  //     },
  //     totalConsumption: {
  //       type: Number,
  //     },
      

  //     tarriffCode: {
  //       type: String,     
  //   },
  //   tarriffType: {
  //       type: String,      
  //   },  
  //     meterStatus: {
  //       type: String,
  //       trim: true,
  //     },
      
  //     netLoad:{
  //      type: String,
  //     },
  //     sanctionedLoad:{
  //       type: String,
  //     },
  //    billNo:{
  //     type: String,
  //    },
  //     previousReadingDate: {
  //       type: String,
  //     },
  //     previousReading: {
  //       type: Number,
  //     },
  //     currentReadingDate: {
  //       type: String,
  //     },
  //     monthAndYear: {
  //       type: String,
  //     },
  //     currentReading: {
  //       type: Number,
  //     },
  //     billDate: {
  //       type:String,
  //     },
  //     currentBillAmount: {
  //       type: Number,
  //     },
  //     totalArrears: {
  //       type: Number,
  //     },
  //     netBillAmount: {
  //       type: Number,
  //     },
  //     roundedBillAmount: {
  //       type: Number,
  //     },
  //     ifPaidByThisDate: {
  //      type:String,
  //     },
  //     earlyPaymentAmount: {
  //       type: Number,
  //     },
  //     ifPaidBefore: {
  //       type: Number,
  //     },
  //     dueDate: {
  //       type:String,
  //     },
  //     dueAlert:{
  //       type: Boolean,
  //       default: false,
  //     },
  //     ifPaidAfter: {
  //       type: Number,
  //     },
  //     overdueDate: {
  //       type:String,
  //     },
  //     paymentStatus:{
  //       type:String,
  //     },
  //     approvedStatus:{
  //       type:String,
  //     },
  //     paidAmount: {
  //       type: Number,
  //     },
  //     promptPaymentDate: {
  //       type:String,
  //     },
  //     overdueDate: {
  //       type:String,
  //     },
  //     pendingAmount: {
  //       type: Number,
  //     },
  //     forwardForGeneration: {
  //       type: Boolean,
  //       default: false,
  //     },
  //     flagStatus: {
  //       type: Boolean,
  //       default: false,
  //     },
  //     receiptNoBillPayment: {
  //       type: String,
  //     },
  //     billPaymentDate:{
  //       type:String,
  //     },
    
      
  //   },
  //   { timestamps: true }
  // );

  
  // billSchema.pre('save', function (next) {
  //   const today = new Date();
  //   const twoDaysBeforeDue = new Date(this.dueDate);
  //   twoDaysBeforeDue.setDate(this.dueDate.getDate() - 2);
  //   if (today.toDateString() === twoDaysBeforeDue.toDateString()) {
  //     this.dueAlert = true;
  //   } else {
  //     this.dueAlert = false;
  //   }
  //   next();
  // });
  // module.exports = mongoose.model("Bill", billSchema);
// -----------------------------------------------------------------------------
const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    consumerNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
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
     
    
    },
    ward: {
      type: String,
      trim: true,
    },
    totalConsumption: {
      type: Number,
    },
    
      tarriffCode: {
        type: String,
      },
      tarriffType: {
        type: String,
      },
    
    meterStatus: {
      type: String,
      trim: true,
    },
    netLoad: {
      type: String,
    },
    sanctionedLoad: {
      type: String,
    },
    billNo: {
      type: String,
    },
    previousReadingDate: {
      type: String, // Format: YYYY-MM-DD
    },
    currentReadingDate: {
      type: String, // Format: YYYY-MM-DD
    },
    dueDate: {
      type: String, // Format: YYYY-MM-DD
    },
    dueAlert: {
      type: Boolean,
      default: false,
    },
    // Additional fields as required...
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);

