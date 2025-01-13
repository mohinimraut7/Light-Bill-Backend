  const mongoose = require("mongoose");
  const billSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true
      },
     cn: {
        type: String,
        ref: 'User',
        trim: true,
      },
     
      role: {
        type: String,
        trim: true,
      },
      ward: {
        type: String,
        trim: true,
      },
      totalConsumption: {
        type: Number,
      },
      meterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meter', 
      },


   
      meterStatus: {
        type: String,
        trim: true,
      },
      
      netLoad:{
       type: String,
      },
     
      previousReadingDate: {
        type: Date,
      },
      previousReading: {
        type: Number,
      },
      currentReadingDate: {
        type: Date,
      },
      currentReading: {
        type: Number,
      },
      billDate: {
        type: Date,
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
        type: Date,
      },
      earlyPaymentAmount: {
        type: Number,
      },
      ifPaidBefore: {
        type: Number,
      },
      dueDate: {
        type: Date,
      },
      dueAlert:{
        type: Boolean,
        default: false,
      },
      ifPaidAfter: {
        type: Number,
      },
      overdueDate: {
        type: Date,
      },
      paymentStatus:{
        type:String,
      },
      approvedStatus:{
        type:String,
      },
      paidAmount: {
        type: Number,
      },
      pendingAmount: {
        type: Number,
      },
      forwardForGeneration: {
        type: Boolean,
        default: false,
      },
      flagStatus: {
        type: Boolean,
        default: false,
      },
      receiptNoBillPayment: {
        type: String,
      },
      billPaymentDate:{
        type: Date,
      },
      juniorEngineerContactNumber:{
        type: Number,
      }
      
    },
    { timestamps: true }
  );

  
  billSchema.pre('save', function (next) {
    const today = new Date();
    const twoDaysBeforeDue = new Date(this.dueDate);
    twoDaysBeforeDue.setDate(this.dueDate.getDate() - 2);
    if (today.toDateString() === twoDaysBeforeDue.toDateString()) {
      this.dueAlert = true;
    } else {
      this.dueAlert = false;
    }
    next();
  });
  module.exports = mongoose.model("Bill", billSchema);
