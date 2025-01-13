const mongoose = require('mongoose');
const tarriffSchema = new mongoose.Schema({
    tarriffCode: {
        type: String,     
    },
    tarriffType: {
        type: String,      
    },        
}, { timestamps: true }); 

module.exports = mongoose.model('Tarriff', tarriffSchema);
