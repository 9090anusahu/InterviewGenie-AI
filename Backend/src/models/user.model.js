 const mongoose=require("mongoose");
 const userSchema=new mongoose.Schema({
    username:{
        type: String,
        unique:[true,"username allready taken"],
        required: true,
    },
    email:{
        type: String,
        unique:[true,"email allready  exist"],
        required: true,
    },
    password:{
        type:String,
        required:true,
    }

 })

 const userModel=mongoose.model("users",userSchema)

 module.exports=userModel