import UserSchema from "../../Model/UserSchema.js";


export async function VerifyEmail(req, res) {
  const code = req.params.code;
  const userId = req.user?.userId;
  if (!code) {
    return res.status(403).send({ error: "Access denied, no code provided!" });
  }
  try {
    const user = await UserSchema.find({ userId });
    if (!user) {
      return res.status(404).send({ success: false, error: "User not Register in database!" });
    }
  
      return res
        .status(201)
        .send({ success: true, error: "Already verified!" });
    const codeMatches = user.some((userObj) => userObj.code === code);
    if (codeMatches) {
      res.status(200).send({ success: true, error: "", msg: "Verified" });
    } else {
      return res.status(403).send({
        success: false,
        error: "Access denied, invalid code provided!",
      });
    }
  } catch (error) {
    res.status(400).send({ success: false, error: "Invalid or expired code!" });
  }
}


