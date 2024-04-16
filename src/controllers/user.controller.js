import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiErrors.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

const registerUser= asyncHandler( async (req,res)=>{
    // res.status(200).json({
    //     message:"ok"

        //steps to register a user

        /*
        1. take input  from the front end
        2. validation-- not empty
        3. check if user is already exists --> if email and username is already in the database
        4. check for image...check for avatar
        5. upload the images to cloudinary  -->keep the reference of the uploaded images
        6. create a user object -- create an entry in the db
        7. remove password and refreshToken field from response
        8. check for user creation if yes return response, else return error
        
        */
      
    const {fullname,email,username,password}=  req.body

   console.log("email",email)

 //    if(fullname==""){
 //       throw new ApiError(400,"full name is required")

 //    } ---> we will have to do this for every field but we have a better method to do this

  //other way
  if(
    [fullname,email,username,password].some((field)=>field?.trim()==="")

  ){
    throw new ApiError(400, "all fields are required")
  }

  const existedUser= User.findOne({
    $or:[{username},{email}]
  })

  if(existedUser)
  {
    throw new ApiError(409, "user with email or username already exists")
  }

  const avatarLocalPath= req.files?.avatar[0]?.path
  const coverImageLocalPath= req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "avatar file is required")
  }

  const avatar= await uploadOnCloudinary(avatarLocalPath)
  const coverImage= await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "avatar file is required")

  }

  const user = await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })

  const createdUser= await User.findById(user._id).select(
    "-password -refreshToken "
  )

  if(!createdUser){
    throw new ApiError(500, "something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createduser,"user registered successfully")
  )




})

 

export {registerUser}