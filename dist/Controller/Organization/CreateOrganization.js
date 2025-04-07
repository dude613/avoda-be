import { prisma } from "../../Components/ConnectDatabase.js";
export async function CreateOrganization(req, res) {
    try {
        const { userId, organizationName, industry, companySize } = req.body;
        const userIdInt = parseInt(userId, 10);
        const validationResponse = await validate(req, res);
        if (validationResponse !== true) {
            return;
        }
        const sizeMapping = {
            "startup (1-10 employees)": "startup",
            "small (11-50 employees)": "small",
            "medium (51-200 employees)": "medium",
            "large (201-500 employees)": "large"
        };
        const newOrg = await prisma.organization.create({
            data: {
                userId: userIdInt,
                name: organizationName,
                industry: industry,
                size: sizeMapping[companySize],
            },
        });
        return res
            .status(200)
            .send({ success: true, message: "Organization created successfully!" });
    }
    catch (e) {
        console.log("error message organization Creation!", e.message);
        return res
            .status(500)
            .send({ error: "Internal server error. Please try again!" });
    }
}
export async function SkipOrganization(req, res) {
    try {
        const { OrgId } = req.body;
        if (!OrgId) {
            return res
                .status(404)
                .send({ success: false, error: "Organization Id is required!" });
        }
        const orgIdInt = parseInt(OrgId, 10);
        if (isNaN(orgIdInt)) {
            return res.status(400).send({ success: false, error: "Invalid Organization ID format!" });
        }
        const org = await prisma.organization.update({
            where: {
                id: orgIdInt,
            },
            data: {
                onboardingSkipped: true,
            },
        });
        if (!org) {
            return res
                .status(404)
                .send({ success: false, error: "Organization not found!" });
        }
        return res
            .status(200)
            .send({ success: true, message: "Organization skipped successfully!" });
    }
    catch (error) {
        console.log("Error message skipping organization:", error.message);
        return res
            .status(500)
            .send({ error: "Internal server error. Please try again!" });
    }
}
export async function UpdateOrganization(req, res) {
    try {
        const { userId, OrgId, name, industry, size } = req.body;
        if (!OrgId) {
            return res.status(404).send({ success: false, error: "Organization ID is required!" });
        }
        const orgIdInt = parseInt(OrgId, 10);
        if (isNaN(orgIdInt)) {
            return res.status(400).send({ success: false, error: "Invalid Organization ID format!" });
        }
        const validationResponse = await validate(req, res);
        if (validationResponse !== true) {
            return;
        }
        const org = await prisma.organization.update({
            where: {
                id: orgIdInt,
            },
            data: {
                name: name,
                industry: industry,
                size: size,
            },
        });
        if (!org) {
            return res
                .status(404)
                .send({ success: false, error: "Organization not found!" });
        }
        return res
            .status(200)
            .send({ success: true, message: "Organization updated successfully!" });
    }
    catch (e) {
        console.log("error message update organization!", e.message);
        return res
            .status(500)
            .send({ error: "Internal server error. Please try again!" });
    }
}
export async function GetOrganization(req, res) {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            return res
                .status(400)
                .send({ success: false, error: "Invalid User ID format!" });
        }
        if (!userId) {
            return res
                .status(404)
                .send({ success: false, error: "user Id is required!" });
        }
        const orgList = await prisma.organization.findMany({
            where: {
                userId: userId,
            },
        });
        if (!orgList || orgList.length === 0) {
            return res.status(404).send({ success: false, error: "No organizations found for this user!" });
        }
        res
            .status(200)
            .send({
            success: true,
            message: "Organization list fetch successfully",
            data: orgList,
        });
    }
    catch (error) {
        console.log(error.message, 'error message get organization list');
        return res.status(500).send({ success: false, error: "Internal server error. Please try again!" });
    }
}
const validate = async (req, res) => {
    try {
        const { userId, organizationName, industry, companySize } = req.body;
        if (!userId) {
            return res
                .status(404)
                .send({ success: false, error: "User ID is required!" });
        }
        const userIdInt = parseInt(userId, 10);
        if (isNaN(userIdInt)) {
            return res
                .status(400)
                .send({ success: false, error: "Invalid User ID format!" });
        }
        if (!organizationName) {
            return res
                .status(404)
                .send({ success: false, error: "Organization name is required!" });
        }
        if (organizationName.length < 2) {
            return res
                .status(400)
                .send({
                success: false,
                error: "Organization name must be at least 2 characters long!",
            });
        }
        const user = await prisma.user.findUnique({
            where: {
                id: userIdInt,
            },
        });
        if (!user) {
            return res
                .status(400)
                .send({
                success: false,
                error: "This user doesn't exist in the database!",
            });
        }
        const org = await prisma.organization.findFirst({
            where: {
                name: organizationName,
            },
        });
        if (org) {
            return res
                .status(400)
                .send({
                success: false,
                error: "Organization name already exists, please try a different name!",
            });
        }
        const validIndustries = [
            "technology",
            "healthCare",
            "finance",
            "education",
            "retail",
            "manufacturing",
            "other",
        ];
        if (industry && !validIndustries.includes(industry)) {
            return res
                .status(400)
                .send({ success: false, error: "Invalid industry value!" });
        }
        const validSizes = [
            "startup (1-10 employees)",
            "small (11-50 employees)",
            "medium (51-200 employees)",
            "large (201-500 employees)",
        ];
        if (companySize && !validSizes.includes(companySize)) {
            return res
                .status(400)
                .send({ success: false, error: "Invalid size value!" });
        }
        return true;
    }
    catch (error) {
        console.log("Error message during organization validation!", error.message);
        return res
            .status(500)
            .send({ error: "Internal server error. Please try again!" });
    }
};
