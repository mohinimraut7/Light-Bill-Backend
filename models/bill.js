
// =======================After================>>>>>>>>>>>
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
      // required: true,
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
    tarriffCode: {
      type: String,
    },
    tarriffType: {
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
    meterPurpose: {
      type: String,
    },
   
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
      type: String, // Format: YYYY-MM-DD
    },
    previousReading: {
      type: Number,
    },
    currentReadingDate: {
      type: String, // Format: YYYY-MM-DD
    },
    currentReading: {
      type: Number,
    },
    currentBillAmount: {
      type: Number,
    },
    totalArrears: {
      type: Number,
    },
    netBillAmount: {
      type: Number,
    },
    roundedBillAmount: {
      type: Number,
    },
    ifPaidByThisDate: {
      type: String,
    },
    earlyPaymentAmount: {
      type: Number,
    },
    ifPaidAfter: {
      type: Number,
    },
    paymentStatus: {
      type: String,
    },
    paidAmount: {
      type: Number,
    },
    pendingAmount: {
      type: Number,
    },
    billPaymentDate: {
      type: String,
    },
    receiptNoBillPayment: {
      type: String,
    },
    promptPaymentDate: {
      type: String,
    },
    promptPaymentAmount: {
      type: Number,
    },
    dueDate: {
      type: String, // Format: YYYY-MM-DD
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
  if (this.dueDate) { // Ensure dueDate exists
    const today = new Date();
    const dueDate = new Date(this.dueDate); // Parse the string to a Date object

    // Calculate the date two days before the due date
    const twoDaysBeforeDue = new Date(dueDate);
    twoDaysBeforeDue.setDate(dueDate.getDate() - 2);

    // Check if today is two days before the due date
    if (today.toDateString() === twoDaysBeforeDue.toDateString()) {
      this.dueAlert = true;
    } else {
      this.dueAlert = false;
    }
  } else {
    this.dueAlert = false; // Default to false if dueDate is not set
  }
  next();
});

module.exports = mongoose.model("Bill", billSchema);

