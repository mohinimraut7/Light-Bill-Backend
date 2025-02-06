const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserVerificationSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        uniqueString: { type: String, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } }
    },
    { timestamps: true } // Adds createdAt and updatedAt
);

const UserVerification = mongoose.model('UserVerification', UserVerificationSchema);
module.exports = UserVerification;
