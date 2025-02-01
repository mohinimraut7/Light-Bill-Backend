const express=require('express');
const router=express.Router();
const {addConsumer,getConsumers,deleteConsumer,editConsumer}=require('../controller/consumer');
router.post('/addConsumer',addConsumer);
router.get('/getConsumers',getConsumers)
router.delete('/deleteConsumer/:consumer_id',deleteConsumer)
router.put('/editConsumer/:consumerid',editConsumer)
module.exports=router;