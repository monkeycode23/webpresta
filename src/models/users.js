import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
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
    isApple: Boolean,
    isMicrosoft: Boolean,
    isTwitter: Boolean,
    isInstagram: Boolean,
    isLinkedin: Boolean,
    isGithub: Boolean,
    isDribbble: Boolean,
    isBehance: Boolean,
    isPinterest: Boolean,
    isTiktok: Boolean,
})  


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const User = mongoose.model('User', userSchema)

export default User