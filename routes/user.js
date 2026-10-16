const express = require("express");
const router = express.Router();
// const { addUser,getUsers,login,editProfile,deleteUser,verifyEmail,resendVerificationEmail,verifiedPage} = require("../controller/user");

const { addUser,getUsers,login,editProfile,deleteUser,verifyEmail,resendVerificationEmail,verifiedPage,sendOtp,verifyOtpLogin} = require("../controller/user");

const authMiddleware = require("../middleware/authMiddleware");
router.post("/addUser",addUser);
router.delete('/user/:user_id',deleteUser)
router.put("/user/:userId",authMiddleware,editProfile);
router.post('/login',login)

// 16-Oct-2026: SMS OTP login (password login jasa aahe tasach)
router.post('/sendOtp',sendOtp)
router.post('/verifyOtpLogin',verifyOtpLogin)

router.get("/getUsers",getUsers);


router.get('/verify-email/:token', verifyEmail);

router.get("/verified", verifiedPage);

router.post("/resend-verification", resendVerificationEmail);


module.exports=router;