import { Router } from "express";
import { registrUser } from "../conrollers/user.controllers.js";

const router=Router()
router.route("/register").post(registrUser)
export default router