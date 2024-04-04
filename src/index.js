//require('dotenv').config({path:'./env'})
import connectDB from "./db/connect.js"
import express from "express"
import dotenv from "dotenv"
import { DB_NAME } from "./constants.js"

dotenv.config({path:'./env'})
const app= express()
console.log(DB_NAME)

connectDB()























// /*
// (async ()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//        app.on("error",(error)=>{
//         console.log("ERRR",error);
//         throw error
//        })

//        app.listen(process.env.PORT, ()=>{
//         console.log(`app is listening on port ${process.env.PORT}`)
//        })

//     }
//     catch(error){
//         console.error("error: ",error )
//         throw err

//     }
// })()
// */