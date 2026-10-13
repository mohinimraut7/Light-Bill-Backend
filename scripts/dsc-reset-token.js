// Lock झालेला DSC token server वरून reset करा:
//   node scripts/dsc-reset-token.js officer@email.com
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");
const { resetToken } = require("../utils/dsc/dummyToken");

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node scripts/dsc-reset-token.js <user-email>");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lightbill");
  const user = await User.findOne({ email });
  if (!user) {
    console.log("User सापडला नाही:", email);
  } else {
    console.log((await resetToken(user._id)) ? `Reset झाला: ${email}` : `Token नाही: ${email}`);
  }
  await mongoose.disconnect();
})();