const express=require('express');
const { addRemarkReports } = require('../controller/reports');
const router=express.Router();

router.post('/addRemarkReport',addRemarkReports)

module.exports=router;  