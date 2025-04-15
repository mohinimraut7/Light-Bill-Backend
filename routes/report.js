const express=require('express');
const multer = require('multer'); 

const { addRemarkReports,getReports, searchReport } = require('../controller/reports');
const router=express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/"); // ✅ PDF files `uploads/` फोल्डर मध्ये सेव्ह होतील
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
  const upload = multer({ storage: storage });

router.post('/addRemarkReport',upload.single("pdfFile"),addRemarkReports)
router.get('/getReports',getReports)
router.post('/searchReport',searchReport)
module.exports=router;  