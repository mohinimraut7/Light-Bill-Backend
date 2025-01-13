const mongoose=require('mongoose');
const roleSchema=new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    name:{
        type:String,
       
    },
    username:{
        type:String,
    },
    
    email:{
        type:String,
        required:true 
    },
    contactNumber:{
        type:String,
        
    },
    password:{
        type:String,
        required:true 
    },
    ward:{
        type:String,
        required:true 
    }
})
module.exports=mongoose.model('Role',roleSchema)