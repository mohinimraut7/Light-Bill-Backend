const express = require("express");
const router = express.Router();
const { addUser,getUsers,login,editProfile,deleteUser,verifyEmail,resendVerificationEmail,verifiedPage} = require("../controller/user");
const authMiddleware = require("../middleware/authMiddleware");
router.post("/addUser",addUser);
router.delete('/user/:user_id',deleteUser)
router.put("/user/:userId",authMiddleware,editProfile);
router.post('/login',login)
router.get("/getUsers",getUsers);


router.get('/verify-email/:token', verifyEmail);

router.get("/verified", verifiedPage);

router.post("/resend-verification", resendVerificationEmail);
module.exports=router;