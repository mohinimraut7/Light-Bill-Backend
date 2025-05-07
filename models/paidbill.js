const mongoose = require('mongoose');

const paidbillSchema = new mongoose.Schema({
    consumerNumber: {
        type: String,
    } ,
    receiptAmount: {
        type: Number,
      },
      receiptDate: {
        type: String,
      },
}, { timestamps: true }); 

module.exports = mongoose.model('Paidbill', paidbillSchema);
