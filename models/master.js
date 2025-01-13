const mongoose=require('mongoose');
const masterSchema=new mongoose.Schema({
   
    name:{
        type:String,
        required:true,
        unique:true
    },
})
module.exports=mongoose.model('Master',masterSchema)