import Organization from "../../Model/OrganizationSchema.js";
import UserSchema from "../../Model/UserSchema.js";

export async function CreateOrganization(req, res) {
    try {
        const { userId, organizationName, industry, companySize } = req.body;
        const validationResponse = await validate(req, res);
        if (validationResponse !== true) {
            return;
        }

        const newOrg = new Organization({
            user: userId,
            name: organizationName,
            industry,
            size: companySize
        });

        await newOrg.save();

        return res.status(200).send({ success: true, message: "Organization created successfully!" });

    } catch (e) {
        console.log("error message organization Creation!", e.message);
        return res.status(500).send({ error: "Internal server error. Please try again!" });
    }
}

export async function SkipOrganization(req, res) {
    try {
        const { OrgId } = req.body;

        if (!OrgId) {
            return res.status(404).send({ success: false, error: "Organization Id is required!" });
        }

        const org = await Organization.findById(OrgId);
        if (!org) {
            return res.status(404).send({ success: false, error: "Organization not found!" });
        }

        org.onboardingSkipped = true;
        await org.save();

        return res.status(200).send({ success: true, message: "Organization skipped successfully!" });
    } catch (error) {
        console.log("Error message skipping organization:", error.message);
        return res.status(500).send({ error: "Internal server error. Please try again!" });
    }
}

export async function UpdateOrganization(req, res) {
    try {
        const { userId, OrgId, name, industry, size } = req.body;

        const validationResponse = await validate(req, res);
        if (validationResponse !== true) {
            return;
        }
        const org = await Organization.findById(OrgId);
        if (!org) {
            return res.status(404).send({ success: false, error: "Organization not found!" });
        }

        org.name = name || org.name;
        org.industry = industry || org.industry;
        org.size = size || org.size;

        await org.save();

        return res.status(200).send({ success: true, message: "Organization updated successfully!" });

    } catch (e) {
        console.log("error message update organization!", e.message);
        return res.status(500).send({ error: "Internal server error. Please try again!" });
    }
}

export async function GetOrganization(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(404).send({ success: false, error: "user Id is required!" });
        }

        const orgList = await Organization.find({ user: userId })
        if (!orgList) {
            return res.status(400).send({ success: false, error: "Organization not found!" })
        }
        res.status(200).send({ success: true, message: "Organization list fetch successfully", data: orgList })
    } catch (error) {
        console.log(error.message, 'error message get organization list');
    }
}

const validate = async (req, res) => {
    try {
        const { userId, organizationName, industry, companySize } = req.body;

        if (!userId) {
            return res.status(404).send({ success: false, error: "User ID is required!" });
        }
        if (!organizationName) {
            return res.status(404).send({ success: false, error: "Organization name is required!" });
        }
        if (organizationName.length < 2) {
            return res.status(400).send({ success: false, error: "Organization name must be at least 2 characters long!" });
        }

        const user = await UserSchema.findOne({ _id: userId });
        if (!user) {
            return res.status(400).send({ success: false, error: "This user doesn't exist in the database!" });
        }

        const org = await Organization.findOne({ name: organizationName });
        if (org) {
            return res.status(400).send({ success: false, error: "Organization name already exists, please try a different name!" });
        }

        const validIndustries = ['technology', 'healthCare', 'finance', 'education', 'retail', 'manufacturing', 'other'];
        if (industry && !validIndustries.includes(industry)) {
            return res.status(400).send({ success: false, error: "Invalid industry value!" });
        }

        const validSizes = ['startup (1-10 employees)', 'small (11-50 employees)', 'medium (51-200 employees)', 'large (201-500 employees)'];
        if (companySize && !validSizes.includes(companySize)) {
            return res.status(400).send({ success: false, error: "Invalid size value!" });
        }

        return true;

    } catch (error) {
        console.log("Error message during organization validation!", error.message);
        return res.status(500).send({ error: "Internal server error. Please try again!" });
    }
}
