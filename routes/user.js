const express = require("express");
const router = express.Router();
const { addUser,getUsers,login,editProfile,deleteUser} = require("../controller/user");
// addUserFromThirdPartyAPI
const authMiddleware = require("../middleware/authMiddleware");
router.post("/addUser",addUser);
router.delete('/user/:user_id',deleteUser)
router.put("/user/:userId",authMiddleware,editProfile);
router.post('/login',login)
router.get("/getUsers",getUsers);
// router.post("/addUserFromThirdPartyAPI", addUserFromThirdPartyAPI);
module.exports=router;