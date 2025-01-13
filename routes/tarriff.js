const express=require('express');
const router=express.Router();
const {addTarriff,getTarriffs,deleteTarriff,editTarriff}=require('../controller/tarriff');
router.post('/addTarriff',addTarriff);
router.get('/getTarriffs',getTarriffs)
router.delete('/deleteTarriff/:tarriff_id',deleteTarriff)
router.post('/editTarriff/:tarriff_id',editTarriff)
module.exports=router;