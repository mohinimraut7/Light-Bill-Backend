// const express=require('express');
// const router=express.Router();
// const {addConsumer,getConsumers,deleteConsumer,editConsumer,importExcel,deleteAll}=require('../controller/consumer');
// router.post('/addConsumer',addConsumer);
// router.post('/import-excel',importExcel);
// router.delete('/deleteAll',deleteAll);
// router.get('/getConsumers',getConsumers)
// router.delete('/deleteConsumer/:consumer_id',deleteConsumer)
// router.put('/editConsumer/:consumerid',editConsumer)
// module.exports=router;




const express=require('express');
const router=express.Router();
const {addConsumer,getConsumers,deleteConsumer,editConsumer,importExcel,deleteAll}=require('../controller/consumer');
router.post('/addConsumer',addConsumer);
router.post('/import-excel',importExcel);
const superAdminOnly = require('../middleware/superAdminOnly'); // 31-Oct-2026
// router.delete('/deleteAll',deleteAll);
router.delete('/deleteAll',superAdminOnly,deleteAll); // 31-Oct-2026: आधी login शिवाय सगळे consumers delete होऊ शकत होते
router.get('/getConsumers',getConsumers)
router.delete('/deleteConsumer/:consumer_id',deleteConsumer)
router.put('/editConsumer/:consumerid',editConsumer)
module.exports=router;