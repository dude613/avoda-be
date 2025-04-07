import { prisma } from "../../Components/ConnectDatabase.js";
import {
    CreateOrganizationRequest,
    SkipOrganizationRequest,
    UpdateOrganizationRequest,
    GetOrganizationRequest,
    OrganizationResponse,
    ValidateFunction,
    sizeMapping,
    validIndustries,
    validCompanySizes,
    CompanySizeString, // Import the specific string type for validation
    OrganizationSize // Import the mapped size type for Prisma
} from '../../types/organization.types.js'; // Adjust path as needed, TS often resolves without extension

// --- Controller Functions ---

export async function CreateOrganization(req: CreateOrganizationRequest, res: OrganizationResponse): Promise<void> {
  try {
    // Body is already typed by CreateOrganizationRequest
    const { userId, organizationName, industry, companySize } = req.body;

    // Validate and Parse userId
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
        // Although validate might catch this, good practice to check early
        res.status(400).send({ success: false, error: "Invalid User ID format!" });
        return;
    }

    // Call the typed validate function
    const validationResponse = await validate(req, res);
    // If validate sent a response, it returns void, otherwise true
    if (validationResponse !== true) {
      return; // Exit if validation failed and sent a response
    }

    // Map companySize only if it exists
    let mappedSize: OrganizationSize | undefined = undefined;
    if (companySize && sizeMapping[companySize]) {
        mappedSize = sizeMapping[companySize];
    } else if (companySize) {
        // Handle case where companySize is provided but not in mapping (should be caught by validate, but good defense)
        console.warn(`Invalid companySize '${companySize}' passed validation but not found in mapping.`);
        // Decide how to handle: error out, use a default, or proceed with undefined?
        // Let's proceed with undefined as validate should have caught it.
    }


    const newOrg = await prisma.organization.create({
      data: {
        userId: userIdInt,
        name: organizationName,
        // Only include industry/size if they are valid and provided
        ...(industry && { industry: industry }),
        ...(mappedSize && { size: mappedSize }),
      },
    });

    res
      .status(200)
      .send({ success: true, message: "Organization created successfully!", organizationId: newOrg.id }); // Optionally return new ID

  } catch (e: unknown) { // Type catch block error
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.log("error message organization Creation!", errorMessage);
    res
      .status(500)
      .send({ error: "Internal server error. Please try again!" });
  }
}

export async function SkipOrganization(req: SkipOrganizationRequest, res: OrganizationResponse): Promise<void> {
  try {
    const { OrgId } = req.body;

    // OrgId is required by the interface, but good practice to double-check
    if (!OrgId) {
      // This case should ideally not happen if middleware/validation enforces the body structure
      res.status(400).send({ success: false, error: "Organization ID is required in the request body!" });
      return;
    }

    const orgIdInt = parseInt(OrgId, 10);
    if (isNaN(orgIdInt)) {
      res.status(400).send({ success: false, error: "Invalid Organization ID format!" });
      return;
    }

    // Use updateMany or findUnique+update to handle potential not found cases gracefully
    const org = await prisma.organization.update({
      where: {
        id: orgIdInt,
      },
      data: {
        onboardingSkipped: true,
      },
    });

    // update throws an error if not found by default (P2025), so checking !org might be redundant
    // unless error handling is configured differently or you use updateMany.
    // Assuming default behavior, the catch block will handle not found.

    res
      .status(200)
      .send({ success: true, message: "Organization skipped successfully!" });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("Error message skipping organization:", errorMessage);
    // Check for Prisma specific error codes if needed (e.g., P2025 for record not found)
    if (error instanceof Error && (error as any).code === 'P2025') {
        res.status(404).send({ success: false, error: "Organization not found!" });
    } else {
        res.status(500).send({ error: "Internal server error. Please try again!" });
    }
  }
}

export async function UpdateOrganization(req: UpdateOrganizationRequest, res: OrganizationResponse): Promise<void> {
  try {
    const { OrgId, name, industry, size } = req.body;

    if (!OrgId) {
        res.status(400).send({ success: false, error: "Organization ID is required in the request body!" });
        return;
    }

    const orgIdInt = parseInt(OrgId, 10);
    if (isNaN(orgIdInt)) {
      res.status(400).send({ success: false, error: "Invalid Organization ID format!" });
      return;
    }

    // --- Validation Specific to Update ---
    // The original 'validate' function is for creation and checks for existing org name,
    // which is not suitable here. We need separate validation for update.
    // For now, we'll just validate the provided fields directly.

    if (name && name.length < 2) {
        res.status(400).send({ success: false, error: "Organization name must be at least 2 characters long!" });
        return;
    }
    if (industry && !validIndustries.includes(industry)) {
        res.status(400).send({ success: false, error: "Invalid industry value!" });
        return;
    }
    // Note: The 'size' in UpdateOrganizationBody is already the mapped OrganizationSize type.
    // If the request still sends the descriptive string, the type definition or request handling needs adjustment.
    // Assuming the request sends the correct mapped 'size' ('startup', 'small', etc.)
    const validMappedSizes: OrganizationSize[] = ['startup', 'small', 'medium', 'large'];
    if (size && !validMappedSizes.includes(size)) {
        res.status(400).send({ success: false, error: "Invalid size value!" });
        return;
    }
    // Add check: Ensure at least one field is provided for update?
    if (name === undefined && industry === undefined && size === undefined) {
        res.status(400).send({ success: false, error: "No fields provided for update." });
        return;
    }
    // --- End Update Validation ---


    const org = await prisma.organization.update({
      where: {
        id: orgIdInt,
        // Optionally add userId check if only the owner can update
        // userId: userIdInt // Assuming userId is available, e.g., from auth middleware
      },
      data: {
        // Conditionally include fields only if they are provided in the request
        ...(name !== undefined && { name: name }),
        ...(industry !== undefined && { industry: industry }),
        ...(size !== undefined && { size: size }),
      },
    });

    // Again, Prisma's update throws P2025 if not found.

    res
      .status(200)
      .send({ success: true, message: "Organization updated successfully!" });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.log("error message update organization!", errorMessage);
    if (e instanceof Error && (e as any).code === 'P2025') {
        res.status(404).send({ success: false, error: "Organization not found!" });
    } else {
        res.status(500).send({ error: "Internal server error. Please try again!" });
    }
  }
}

export async function GetOrganization(req: GetOrganizationRequest, res: OrganizationResponse): Promise<void> {
  try {
    // userId is from req.params, typed by GetOrganizationRequest
    const userIdString = req.params.userId;

    // userId is required by the route pattern, but check anyway
    if (!userIdString) {
        res.status(400).send({ success: false, error: "User ID is required in the URL path!" });
        return;
    }

    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      res.status(400).send({ success: false, error: "Invalid User ID format!" });
      return;
    }

    const orgList = await prisma.organization.findMany({
      where: {
        userId: userId,
      },
    });

    // No need to check !orgList, findMany returns [] if none found.
    if (orgList.length === 0) {
      // Changed status to 200 with empty data or keep 404? API design choice.
      // Let's keep 404 as per original logic.
      res.status(404).send({ success: false, error: "No organizations found for this user!" });
      return; // Explicit return
    }

    res
      .status(200)
      .send({
        success: true,
        message: "Organization list fetched successfully",
        data: orgList,
      });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(errorMessage, 'error message get organization list');
    res.status(500).send({ success: false, error: "Internal server error. Please try again!" });
  }
}


// --- Validation Function ---
// NOTE: This validation is primarily for CREATION. Using it for UPDATE might be problematic.
// Consider refactoring or creating a separate validation function for updates.
const validate: ValidateFunction = async (req, res) => {
  // req is typed as CreateOrganizationRequest here
  try {
    const { userId, organizationName, industry, companySize } = req.body;

    // userId validation
    if (!userId) { // Should be caught by CreateOrganizationRequest type, but belt-and-suspenders
      res.status(400).send({ success: false, error: "User ID is required!" });
      return false; // Indicate validation failed
    }
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      res.status(400).send({ success: false, error: "Invalid User ID format!" });
      return false;
    }

    // organizationName validation
    if (!organizationName) { // Should be caught by type
      res.status(400).send({ success: false, error: "Organization name is required!" });
      return false;
    }
    if (organizationName.length < 2) {
      res.status(400).send({
          success: false,
          error: "Organization name must be at least 2 characters long!",
        });
      return false;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
    });
    if (!user) {
      res.status(400).send({ success: false, error: "User not found!" });
      return false;
    }

    // Check if organization name already exists (for creation)
    const existingOrg = await prisma.organization.findFirst({
      where: { name: organizationName }, // Consider case-insensitivity? .toLowerCase()
    });
    if (existingOrg) {
      res.status(400).send({
          success: false,
          error: "Organization name already exists, please try a different name!",
        });
      return false;
    }

    // Industry validation (if provided)
    if (industry && !validIndustries.includes(industry)) {
      res.status(400).send({ success: false, error: "Invalid industry value!" });
      return false;
    }

    // Company Size validation (if provided) - Use CompanySizeString type here
    if (companySize && !validCompanySizes.includes(companySize)) {
      res.status(400).send({ success: false, error: "Invalid company size value!" });
      return false;
    }

    return true; // Validation passed

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("Error message during organization validation!", errorMessage);
    res.status(500).send({ error: "Internal server error during validation. Please try again!" });
    return false; // Indicate validation failed due to internal error
  }
};
