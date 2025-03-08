import express from "express";
import { Register } from "../../Controller/User/Register.js";
import { Login } from "../../Controller/User/Login.js";

export const authRouter = express.Router();


authRouter.post("/register",Register)
authRouter.post("/login",Login)
