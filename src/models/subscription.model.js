import mongoose from "mongoose"
const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,    // one who subscribes the channel   
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,   // the one who is the owner of the channel
        ref:"User"
    }

},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)