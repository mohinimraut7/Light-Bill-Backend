// const express=require('express');
// const router=express.Router();
// const {addBill,updateBillPaymentStatus,editBill,getBills,getBillsWithMeterPurpose,updateBillStatus,deleteBill,updateFlagStatus, massUpdateBillStatus,reverseMassBillStatus,addBillFromThirdPartyAPI,addReceipt,editReceipt,dropBillsCollection,addRemark,editRemark,getBillsOverdue}=require('../controller/bill');
// const authMiddleware = require('../middleware/authMiddleware');
// const verifyStaticHeader=require('../middleware/verifyStaticHeader');

// router.post('/addBill',verifyStaticHeader,addBill);
// router.post('/updateBillPaymentStatus',verifyStaticHeader,updateBillPaymentStatus);
// router.delete("/dropBills", dropBillsCollection);

// router.post('/addReceipt',addReceipt)
// router.put('/editReceipt',editReceipt)

// router.post('/addRemark',addRemark)
// router.put('/editRemark',editRemark)

// console.log("verifyStaticHeader",verifyStaticHeader)
// router.put('/editBill/:billId',authMiddleware,editBill);
// router.get("/getBills",getBills);
// router.get("/getBillsOverdue",getBillsOverdue);
// router.get("/getBillsWithMeterPurpose",getBillsWithMeterPurpose);
// router.put('/updateBillStatus',authMiddleware,updateBillStatus);
// router.put('/updateFlagStatus',authMiddleware,updateFlagStatus);
// router.put('/massUpdateBillStatus',authMiddleware,massUpdateBillStatus);
// router.put('/reverseMassBillStatus',authMiddleware,reverseMassBillStatus);
// router.delete(`/bill/:billId`,authMiddleware,deleteBill);
// router.post("/addBillFromThirdPartyAPI", addBillFromThirdPartyAPI);
// module.exports=router;  



// -------------------------------------------------------------------------------------------



const express=require('express');
const router=express.Router();
const {addBill,updateBillPaymentStatus,editBill,getBills,getBillsWithMeterPurpose,updateBillStatus,deleteBill,updateFlagStatus, massUpdateBillStatus,reverseMassBillStatus,addBillFromThirdPartyAPI,addReceipt,editReceipt,dropBillsCollection,addRemark,editRemark,getBillsOverdue,getBillRemarks}=require('../controller/bill');
const authMiddleware = require('../middleware/authMiddleware');
const verifyStaticHeader=require('../middleware/verifyStaticHeader');

router.post('/addBill',verifyStaticHeader,addBill);
router.post('/updateBillPaymentStatus',verifyStaticHeader,updateBillPaymentStatus);
router.delete("/dropBills", dropBillsCollection);

router.post('/addReceipt',addReceipt)
router.put('/editReceipt',editReceipt)

router.post('/addRemark',addRemark)
router.put('/editRemark',editRemark)

// console.log("verifyStaticHeader",verifyStaticHeader)  // 3-Oct-2026: फक्त debug log होता, बंद केला
router.put('/editBill/:billId',authMiddleware,editBill);
router.get("/getBills",getBills);
router.get("/getBillsOverdue",getBillsOverdue);
// NEW (3-Oct-2026): View Remarks modal साठी एका bill चे signature सकट remarks
router.get("/getBillRemarks/:billId",getBillRemarks);
router.get("/getBillsWithMeterPurpose",getBillsWithMeterPurpose);
router.put('/updateBillStatus',authMiddleware,updateBillStatus);
router.put('/updateFlagStatus',authMiddleware,updateFlagStatus);
router.put('/massUpdateBillStatus',authMiddleware,massUpdateBillStatus);
router.put('/reverseMassBillStatus',authMiddleware,reverseMassBillStatus);
router.delete(`/bill/:billId`,authMiddleware,deleteBill);
router.post("/addBillFromThirdPartyAPI", addBillFromThirdPartyAPI);
module.exports=router;  