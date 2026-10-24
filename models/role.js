// const mongoose=require('mongoose');
// const roleSchema=new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//       },
//     name:{
//         type:String,
       
//     },
   
    
//     email:{
//         type:String,
//         required:true 
//     },
   
   
//     ward:{
//         type:String,
      
//     }
// })
// module.exports=mongoose.model('Role',roleSchema)



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
   
    
    email:{
        type:String,
        required:true 
    },
   
   
    ward:{
        type:String,
      
    },
    // 23-Oct-2026: Head Office "Clerk" साठी विभाग (Electrical / Accounts)
    department:{
        type:String,
        trim:true,
    }
})
module.exports=mongoose.model('Role',roleSchema)