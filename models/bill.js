
const mongoose = require("mongoose");

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
      email: {
        type: String,
        trim: true,
      },
      contactNumber: {
        type: String,

      },
      ward: {
        type: String, 
        trim: true,
      },
      adjustmentUnit: {
        type: Number,
      },
      totalConsumption: {
        type: Number,
      },
      installationDate: {
        type: String,
      },
    
      tarriffDescription: {
        type: String,
      },
      meterNumber: {
        type: String,
        // unique: true,
        // required: true,
      },

      meterStatus: {
        type: String,
        trim: true,
      },
      phaseType: {
        type: String,
    },
      // meterPurpose: {
      //   type: String,
      // },
    
      billingUnit: {
        type: String,
      },
      netLoad: {
        type: String,
      },
      sanctionedLoad: {
        type: String,
      },
      billDate: {
        type: String,
      },
      billNo: {
        type: String,
      },
      monthAndYear: {
        type: String,
      },
      previousReadingDate: {
        type: String,
      },
      previousReading: {
        type: Number,
    },
    currentReadingDate: {
      type: String, 
    },
    currentReading: {
      type: Number,
    },
    currentBillAmount: {
      type: Number,
    },
    netBillAmount: {
      type: Number,
    },
    roundedBillAmount: {
      type: Number,
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
    // pendingAmount: {
    //   type: Number,
    // },
    lastReceiptDate: {
      type: String,
    },
    // receiptNoBillPayment: {
    //   type: String,
    // },
    promptPaymentDate: {
      type: String,
    },
    promptPaymentAmount: {
      type: Number,
    },
    dueDate: {
      type: String, 
    },
    overDueAmount: {
      type: Number,
    },
    dueAlert: {
      type: Boolean,
      default: false,
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

