const mongoose = require('mongoose');

const consumerSchema = new mongoose.Schema({
    consumerNumber: {
        type: String,
        unique: true,
        required: true,
    }   
}, { timestamps: true }); 

module.exports = mongoose.model('Consumer', consumerSchema);
