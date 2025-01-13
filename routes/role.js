const express=require('express');
const router=express.Router();
const {addRole,editRole,getRoles,deleteRole}=require('../controller/role');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/addRole',authMiddleware,addRole);
router.delete('/deleteRole/:role_id',deleteRole)
router.post('/editRole/:role_id',authMiddleware,editRole)
router.get('/getRoles',getRoles)
module.exports=router;