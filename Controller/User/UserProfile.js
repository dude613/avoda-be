import UserSchema from "../../Model/UserSchema.js";

export async function GetProfileData(req, res) {
    try {
        const { userId } = req.body;

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: "User not found" });
        }
        return res.status(200).send({ success: true, message: "user details fetch successfully", data: user });
    } catch (error) {
        console.error("Error fetching user data: ", error);
        return res.status(500).send({ success: false, error: "Server error" });
    }
}


export async function UpdateProfileData(req, res) {
    try {
        const { userId, name, profilePicture, address } = req.body;

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: "User not found" });
        }


        return res.status(200).send({
            success: true,
            message: "User profile updated successfully",
            data: user
        });
    } catch (error) {
        console.error("Error updating user profile: ", error);
        return res.status(500).send({ success: false, error: "Server error" });
    }
}
