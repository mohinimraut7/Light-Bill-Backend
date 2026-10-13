// Officer चा DSC token (आत्ता DUMMY). एका user ला एक token.
const mongoose = require("mongoose");

const dscTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    provider: { type: String, default: "DUMMY" }, // नंतर: USB_TOKEN
    tokenSerial: { type: String },
    subjectName: { type: String },
    designation: { type: String },
    certPem: { type: String },
    certSerial: { type: String },
    validFrom: { type: Date },
    validTo: { type: Date },
    // PIN ने encrypt केलेली private key (फक्त dummy mode). PIN स्वतः कुठेही save होत नाही.
    encryptedKeyPem: { type: String, select: false },
    failedAttempts: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "LOCKED", "REVOKED"], default: "ACTIVE" },
    issuedAt: { type: Date },
    lastUsedAt: { type: Date },
    lockedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DscToken", dscTokenSchema);