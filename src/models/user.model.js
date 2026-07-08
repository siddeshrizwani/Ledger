const mongoose = require("mongoose");
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required for creating a user"],
        trim: true,
        lowercase: true,
        unique: [true,"Email already exists"],
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address"
        ]
    },
    name:{
        type:String,
        required:[true,'Name is required to create user']
    },
    password: {
        type: String,
        required: [true, "Password is required for creating a user"],
        trim: true,
        minlength: [6, "Password must be at least 6 characters long"],
        select:false
        // select false means whenever user data is fetched from db password wont come with it

    }
},{
    timestamps:true
});
// if user password is changed then we need to hash the user password
// for this we need the to install bcryptjs module 
userSchema.pre("save",async function(next){
    if(!this.isModified('password')){
        return;
    }
    const hash= await bcrypt.hash(this.password,10)
    this.password=hash;
    return ;
})

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
}
module.exports = mongoose.model("User", userSchema);