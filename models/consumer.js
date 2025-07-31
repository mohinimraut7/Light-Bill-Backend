const mongoose = require('mongoose');

const consumerSchema = new mongoose.Schema({
    consumerNumber: {
        type: String,
        unique: true,
        required: true,
        match: [/^\d{12}$/, 'Consumer Number must be exactly 12 digits'],
    } ,
     meterNumber: {
        type: String
      },
    consumerPlace: {
        type: String,
    },  
    consumerAddress: {
        type: String,
    },  
    meterPurpose: {
        type: String,
    },
    ward: {
        type: String,
     } ,
    phaseType: {
        type: String,
    },
}, { timestamps: true }); 

module.exports = mongoose.model('Consumer', consumerSchema);
