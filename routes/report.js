// // const express=require('express');
// // const multer = require('multer'); 

// // const { addRemarkReports,getReports, searchReport,deleteMonthReport,clearAllReports} = require('../controller/reports');
// // const router=express.Router();

// // const storage = multer.diskStorage({
// //     destination: function (req, file, cb) {
// //       cb(null, "uploads/");
// //     },
// //     filename: function (req, file, cb) {
// //       cb(null, Date.now() + "-" + file.originalname);
// //     },
// //   });
// //   const upload = multer({ storage: storage });

// // router.post('/addRemarkReport',upload.single("pdfFile"),addRemarkReports)
// // router.get('/getReports',getReports)
// // router.post('/searchReport',searchReport)
// // router.delete('/deleteMonthReport/:month',deleteMonthReport)
// // router.delete('/deleteReport',clearAllReports)

// // module.exports=router;  


// const express=require('express');
// const multer = require('multer'); 

// // const { addRemarkReports,getReports, searchReport,deleteMonthReport,clearAllReports, verifyReportPdf} = require('../controller/reports');

// const { addRemarkReports,getReports, searchReport,deleteMonthReport,clearAllReports, verifyReportPdf} = require('../controller/reports');
// const { getEnergyInbox } = require('../controller/energyFlowReports'); // 27-Oct-2026

// const router=express.Router();

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "uploads/");
//     },
//     filename: function (req, file, cb) {
//       cb(null, Date.now() + "-" + file.originalname);
//     },
//   // });
//   // const upload = multer({ storage: storage });

//     });
//   // const upload = multer({ storage: storage });
//   // 27-Oct-2026: टिपणीची note image (base64) form field मध्ये येते -> field size 1MB ऐवजी 10MB
//   const upload = multer({ storage: storage, limits: { fieldSize: 10 * 1024 * 1024 } });

// router.post('/addRemarkReport',upload.single("pdfFile"),addRemarkReports)
// // ✅ DSC: PDF मधील digital signatures तपासण्यासाठी (नवीन API)
// router.post('/verifyReportPdf',verifyReportPdf)
// router.get('/getReports',getReports)
// // router.post('/searchReport',searchReport)
// // router.delete('/deleteMonthReport/:month',deleteMonthReport)

// router.post('/searchReport',searchReport)
// router.get('/energyInbox',getEnergyInbox) // 27-Oct-2026: Energy Expenditure - mailbox सारखी files ची यादी
// router.delete('/deleteMonthReport/:month',deleteMonthReport)
// router.delete('/deleteReport',clearAllReports)

// module.exports=router;  



// const express=require('express');
// const multer = require('multer'); 

// const { addRemarkReports,getReports, searchReport,deleteMonthReport,clearAllReports} = require('../controller/reports');
// const router=express.Router();

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "uploads/");
//     },
//     filename: function (req, file, cb) {
//       cb(null, Date.now() + "-" + file.originalname);
//     },
//   });
//   const upload = multer({ storage: storage });

// router.post('/addRemarkReport',upload.single("pdfFile"),addRemarkReports)
// router.get('/getReports',getReports)
// router.post('/searchReport',searchReport)
// router.delete('/deleteMonthReport/:month',deleteMonthReport)
// router.delete('/deleteReport',clearAllReports)

// module.exports=router;  


const express=require('express');
const multer = require('multer'); 

// const { addRemarkReports,getReports, searchReport,deleteMonthReport,clearAllReports, verifyReportPdf} = require('../controller/reports');

const { addRemarkReports,getReports, searchReport,deleteMonthReport,clearAllReports, verifyReportPdf} = require('../controller/reports');
const { getEnergyInbox } = require('../controller/energyFlowReports'); // 27-Oct-2026

const router=express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  // });
  // const upload = multer({ storage: storage });

    });
  // const upload = multer({ storage: storage });
  // 27-Oct-2026: टिपणीची note image (base64) form field मध्ये येते -> field size 1MB ऐवजी 10MB
  const upload = multer({ storage: storage, limits: { fieldSize: 10 * 1024 * 1024 } });

router.post('/addRemarkReport',upload.single("pdfFile"),addRemarkReports)
// ✅ DSC: PDF मधील digital signatures तपासण्यासाठी (नवीन API)
router.post('/verifyReportPdf',verifyReportPdf)
router.get('/getReports',getReports)
// router.post('/searchReport',searchReport)
// router.delete('/deleteMonthReport/:month',deleteMonthReport)

router.post('/searchReport',searchReport)
router.get('/energyInbox',getEnergyInbox) // 27-Oct-2026: Energy Expenditure - mailbox सारखी files ची यादी
// router.delete('/deleteMonthReport/:month',deleteMonthReport)
// router.delete('/deleteReport',clearAllReports)
// 31-Oct-2026: आधी login शिवाय reports delete होऊ शकत होते -> फक्त Super Admin
const superAdminOnly = require('../middleware/superAdminOnly');
router.delete('/deleteMonthReport/:month',superAdminOnly,deleteMonthReport)
router.delete('/deleteReport',superAdminOnly,clearAllReports)

module.exports=router;