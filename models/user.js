
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    cn: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: Number,
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v.toString());
        },
        message: "Contact number must be a 10-digit number"
      }
    },
    address: {
      type: String,
      trim: true,
    },
    signature: { type: String }, 
    city: {
      type: String,
      
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },

    role: {
      type: String,
      trim: true,
      default: "User"
    },    
    

    ward: {
      type: String,
      trim: true,
    },
    wardsection:{
      type: String,
      enum: ['A','B'],
      trim: true,
    },
    verified:{
      type: String,
    },
    description:{
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false, 
    },
    verificationToken: {
      type: String, 
    },
    verificationTokenExpiry: {
      type: Date, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
