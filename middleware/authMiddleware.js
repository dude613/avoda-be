import jwt from "jsonwebtoken"
import User from "../Model/UserSchema.js"

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: No token provided",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid token",
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res.status(401).json({
      success: false,
      message: "Authentication failed: Invalid token",
    })
  }
}

