import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiErrors.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "something went wrong while generating refresh and access token")

  }
}

const registerUser = asyncHandler(async (req, res) => {
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

  const { fullname, email, username, password } = req.body



  //    if(fullname==""){
  //       throw new ApiError(400,"full name is required")

  //    } ---> we will have to do this for every field but we have a better method to do this

  //other way
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")

  ) {
    throw new ApiError(400, "all fields are required")
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "avatar file is required")

  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken "
  )


  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "user registered successfully")
  )




})

const loginUser = asyncHandler(async (req, res) => {
  //req body
  //username or email
  //find the user
  //password check
  //access and refresh tokens
  //send cookies

  const { email, username, password } = req.body
  if (!(email || username)) {
    throw new ApiError(400, "username or password is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(404, "user not found")
  }

  const isPasswordValid = user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid user credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "user logged in successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    })

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "user logged out successfully")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401, " unauthorized request ")
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new ApiError(401, " unauthorized request ")
    }

    if (incomingRefreshToken !== user?.refreshAccessToken) {
      throw new ApiError(401, " refresh token is expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    return res
      .send(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken, refreshToken: newRefreshToken

          },
          "Access token refreshed successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")

  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body
  if (!(newPassword === confirmPassword)) {
    throw new ApiError(402, " passwords doesnot match")

  }
  const user = await User.findById(req?.user.id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(401, "invalid old password")
  }
  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password saved successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {

  const { fullname, email } = req.body
  if (!fullname || !email) {
    throw new ApiError(400, " all fields are required")
  }
  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        fullname: fullname,
        email: email
      }
    },
    { new: true }
  ).select("-password")
  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"))


})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "error while uploading avatar")
  }
  const user = await User.findByIdAndUpdate(req.user.id,

    {
      $set: {
        avatar: avatar.url

      }
    },
    { new: true })

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "  avatar image updated successsfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading coverImage")
  }
  const user = await User.findByIdAndUpdate(req.user.id,

    {
      $set: {
        coverImage: coverImage.url

      }
    },
    { new: true })

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, " cover image updated successsfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,


      }
    }
  ])

  if(!channel.length){
    throw new ApiError(404, "channel does not exist")

  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0]," User channel fetched successfully")
  )



})

export {
  registerUser,
  loginUser, logoutUser,
  refreshAccessToken, changeCurrentPassword,
  getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile
}