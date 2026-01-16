import { Router } from "express";
import { registrUser } from "../conrollers/user.controllers.js";

const router=Router()
router.route("/register").post(
    UploadStream.fields([
{name:"avatar",
    maxCount:1
},
{
    name:"coverImage",
    maxCount:1,
},
    ]),
    registrUser)
export default router