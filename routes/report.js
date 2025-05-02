const express=require('express');
const multer = require('multer'); 

const { addRemarkReports,getReports, searchReport,deleteMonthReport } = require('../controller/reports');
const router=express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  const upload = multer({ storage: storage });

router.post('/addRemarkReport',upload.single("pdfFile"),addRemarkReports)
router.get('/getReports',getReports)
router.post('/searchReport',searchReport)
router.delete('/deleteMonthReport/:month',deleteMonthReport)

module.exports=router;  