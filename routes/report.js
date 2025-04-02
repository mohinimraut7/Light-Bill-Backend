const express=require('express');
const { addRemarkReports,getReports } = require('../controller/reports');
const router=express.Router();

router.post('/addRemarkReport',addRemarkReports)
router.get('/getReports',getReports)

module.exports=router;  