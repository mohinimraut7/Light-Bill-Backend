const mongoose = require('mongoose');

const meterSchema = new mongoose.Schema({
    cn: {
        type: String,
        ref: 'User',
        unique: true,
        required: true,
    },
    meterNumber: {
        type: String,
        unique: true,
        required: true,
    },
    meterPurpose: {
        type: String,
    },
    phaseType: {
        type: String,
    },
    tariffType: {
        type: String,
    },
    sanctionedLoad: {
        type: String,
    },
   
    installationDate: {
        type: Date,
    },
   
    
}, { timestamps: true }); 

module.exports = mongoose.model('Meter', meterSchema);
