
const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
      consumerNumber: {
        type: String,
        trim: true,
        // required: true,
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
    
      tarriffDescription: {
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
    paymentStatus: {
      type: String,
    },
    approvedStatus: {
      type: String,
    },
    lastReceiptAmount: {
      type: Number,
    },
    
    lastReceiptDate: {
      type: String,
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

    receiptNoBillPayment:{
      type: String, 
    },
    juniorEngineerContactNumber: {
      type: Number,
    }
  },
  { timestamps: true }
);
billSchema.pre('save', function (next) {
  if (this.dueDate) { 
    const today = new Date();
    const dueDate = new Date(this.dueDate); 
    const twoDaysBeforeDue = new Date(dueDate);
    twoDaysBeforeDue.setDate(dueDate.getDate() - 2);
    if (today.toDateString() === twoDaysBeforeDue.toDateString()) {
      this.dueAlert = true;
    } else {
      this.dueAlert = false;
    }
  } else {
    this.dueAlert = false; 
  }
  next();
});

module.exports = mongoose.model("Bill", billSchema);

