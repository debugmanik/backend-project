import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
const generateAcessAndRefreshToken=async(userId)=>{
  try{
const user = await User.findById(userId)
const accessToken = user.generateAccessToken()
const refreshToken = user.generateRefreshToken()
user.refreshToken = refreshToken
await user.save({ validateBeforeSave: false })
return {accessToken,refreshToken}
  }
catch (error) {
throw new ApiError(500, "Something went wrongwhile generating referesh and access token")
  }

}
const registerUser = asyncHandler(async (req, res) => {

  console.log("BODY:", req.body);
  console.log("FILES:", req.files);

  const { fullName, email, username, password } = req.body;
  if (
    [fullName, email, username, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
//  console.log(req.files);

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
  avatar: avatar.secure_url,
  coverImage: coverImage?.secure_url || "",
  email,
  password,
  username: username.toLowerCase()
});

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});
  const loginUser = asyncHandler(async (req, res) =>{
// req body -> data
// username or email
//find the user
//password check
//access and referesh token
//send cookie 
const {email, username, password} = req.body
if (!username || !email) {
throw new ApiError(400, "username or email isrequired")
}
const user = await User.findOne({
$or: [{username}, {email}]
})
if (!user) {
throw new ApiError(404, "User does not exist")
}
const isPasswordValid = await user.isPasswordCorrect(password)
if (!isPasswordValid) {
throw new ApiError(401, "Invalid user credentials")
}
const {accessToken,refreshToken}=await generateAcessAndRefreshToken(user._id)
  
 const loggedInUser = await User.findById(User._id).select(
    "-password -refreshToken"
  );
const options={
  httpOnly:true,
  secure:true//only server modified
}

return res
.status(200)
.cookie("acessToken",acessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new ApiResponse(
    200,
    {
user:loggedInUser,accessToken,refreshToken
  },
  "user logged in successfully"
)
)

});
 const logoutUser = asyncHandler(async (req, res) =>{
await User.findByIdAndUpdate(
  req.user._id,
  {
    $set:{
      refreshToken:undefined
    }
  },
  {
    new:true
  }
)
const options={
  httpOnly:true,
  secure:true//only server modified
}
return res
.status(200)
.clearcookie("acessToken",options)
.clearcookie("refreshToken",options)
.json(new ApiResponse(200,{},"User Logged Out"))
 })
export { registerUser ,
  loginUser,
  logoutUser
};