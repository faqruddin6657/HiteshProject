//require('dotenv').config({path:'./env'})

import dotenv from "dotenv"
dotenv.config({path:'./env'})

import {connectDB} from "./db/connect.js"
import express from "express"
const app= express()



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`listening on port ${process.env.PORT}`)
    })

}).catch((error)=>{
    console.log("error in db ", error)
})


























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