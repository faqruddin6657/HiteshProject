import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

export const connectDB= async ()=>{
    try{
        const connectionInstancec =await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n mongoDB connected !! DB host:${connectionInstancec.connection.host}`)

    }catch(error){
        console.log("MONGODB connection error: ", error)
        process.exit(1)

    }
}

