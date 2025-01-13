const express=require('express');
const router=express.Router();
const {addMaster,getMasters,deleteMaster}=require('../controller/Master');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/addMaster',authMiddleware,addMaster);
router.get('/getMasters',getMasters)
router.delete('/deleteMaster/:master_id',deleteMaster)
module.exports=router;