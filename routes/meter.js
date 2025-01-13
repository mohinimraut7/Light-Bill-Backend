const express=require('express');
const router=express.Router();
const {addMeter,getMeters,deleteMeter,editMeter}=require('../controller/meter');
router.post('/addMeter',addMeter);
router.get('/getMeters',getMeters)
router.delete('/deleteMeter/:meter_id',deleteMeter)
router.post('/editMeter/:meter_id',editMeter)
module.exports=router;