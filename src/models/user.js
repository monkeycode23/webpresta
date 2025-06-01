import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    sqlite_id: {
        type: String, // Or Number, depending on your SQLite ID type
        unique: true,
        sparse: true
    },
    isConnected: Boolean,
    username:{
        type:String,
        unique:true,
        sparse:true
    },
    role:{
        type:String,
        enum:["admin","user","mod"],
        default:"user"
            },
    avatar:{
        type:String,
        default:"https://i.pravatar.cc/150?img=64"
    },
    email: {
        type:String,
        unique:true,
        sparse:true
    },
    rooms:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
        }
    ],
    password: String,
    number: String,
    address: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    isAdmin: Boolean,
    isActive: Boolean,
    isDeleted: Boolean,
    isBanned: Boolean,
    isVerified: Boolean,
    isEmailVerified: Boolean,
    isPhoneVerified: Boolean,
    isGoogle: Boolean,
    isFacebook: Boolean,
    notification: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification'
      }]
})  


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
        if(this.password.length > 20){
            next()
        }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.comparePassword = async function (password) {

    return await bcrypt.compare(password, this.password)
}

const User = mongoose.model('User', userSchema)

export default User