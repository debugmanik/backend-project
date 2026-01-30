import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
/* helper*/
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

/*  REGISTER  */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  const newUser = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

/* ===== LOGIN ===== */
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // ❗ FIXED CONDITION
  if ((!email && !username) || !password) {
    throw new ApiError(400, "Username/email and password are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshToken(user._id);

  //  FIXED user._id
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

 const options = {
  httpOnly: true,
  secure: false
};

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) 
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

/*  LOGOUT  */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

const options = {
  httpOnly: true,
  secure: false
};

  return res
    .status(200)
    .clearCookie("accessToken", options) //  FIXED case
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
if(!incomingRefreshToken){
  throw new ApiError(401,"Unauthorized request")
}
const decodedToken=jwt.verify(
  incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
)
const user=User.findById(decodedToken?._id)
if(!user){
 throw new ApiError(401,"invalid Refresh Token")
}
if(incomingRefreshToken!==user?.refreshToken){
  throw new ApiError(401,"Refresh Token is expired")
}

 const options = {
  httpOnly: true,
  secure: true
};
generateAccessAndRefreshToken(user._id)
return res.
status(200)
.cookie("acessToken",acessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new ApiResponse(
    200,
    {
      accessToken,refreshToken:newRefreshToken
    },
    "Acess token refreshed"
  )
)

})
export { registerUser, loginUser, logoutUser ,refreshAccessToken };