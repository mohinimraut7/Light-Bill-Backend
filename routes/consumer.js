const express=require('express');
const router=express.Router();
const {addConsumer,getConsumers,deleteConsumer,editConsumer,importExcel,deleteAll}=require('../controller/consumer');
router.post('/addConsumer',addConsumer);
router.post('/import-excel',importExcel);
router.delete('/deleteAll',deleteAll);
router.get('/getConsumers',getConsumers)
router.delete('/deleteConsumer/:consumer_id',deleteConsumer)
router.put('/editConsumer/:consumerid',editConsumer)
module.exports=router;