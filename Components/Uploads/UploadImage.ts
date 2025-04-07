import upload from './Multer.js'; // Import the configured multer instance (keep .js)
import path from 'path';
import fs from 'fs/promises'; // Use promises version of fs for async/await
import { RequestHandler } from 'express'; // Import RequestHandler type

// Define the correct directory based on Multer.ts configuration
const uploadDir = 'uploads';
const imagesSubDir = 'images';
const fullImagesPath = path.join(uploadDir, imagesSubDir); // Should match Multer.ts

/**
 * Multer middleware configured to handle multiple files under the 'images' field.
 */
export const uploadImages: RequestHandler = upload.fields([
    { name: 'images', maxCount: 10 }, // Field name and max count
    // Add other fields if needed: { name: 'avatar', maxCount: 1 }
]);

/**
 * Deletes all files within the configured image upload directory.
 * USE WITH CAUTION!
 */
export const deleteImages = async (): Promise<void> => {
    try {
        const files = await fs.readdir(fullImagesPath);
        if (files.length === 0) {
            console.log(`Directory ${fullImagesPath} is empty, nothing to delete.`);
            return;
        }
        const unlinkPromises = files.map(file => {
            const filePath = path.join(fullImagesPath, file);
            return fs.unlink(filePath).then(() => {
                console.log(`Deleted file: ${filePath}`);
            }).catch(err => {
                // Log error but don't necessarily stop deleting others
                console.error(`Failed to delete file: ${filePath}`, err);
            });
        });
        await Promise.allSettled(unlinkPromises); // Wait for all deletions to attempt
        console.log(`Attempted deletion of all files in ${fullImagesPath}. Check logs for errors.`);
    } catch (err: any) {
        // Handle errors like directory not found (though Multer.ts should create it)
        if (err.code === 'ENOENT') {
             console.log(`Directory ${fullImagesPath} not found, nothing to delete.`);
        } else {
            console.error(`Could not list or process directory ${fullImagesPath}.`, err);
        }
        // Decide if this function should throw or just log errors
        // throw err; // Uncomment to propagate the error
    }
};

/**
 * Deletes a specific file from the configured image upload directory.
 * @param filename - The name of the file to delete.
 * @returns A promise that resolves on successful deletion or rejects on error.
 */
export const deleteImage = async (filename: string): Promise<{ success: boolean; error?: Error }> => {
    if (!filename) {
        console.error("deleteImage called with empty filename.");
        return { success: false, error: new Error("Filename cannot be empty.") };
    }
    const filePath = path.join(fullImagesPath, filename);
    try {
        await fs.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
        return { success: true };
    } catch (err: any) {
        console.error(`Failed to delete file: ${filePath}`, err);
         // Check if the error is because the file doesn't exist (ENOENT)
        if (err.code === 'ENOENT') {
            return { success: false, error: new Error(`File not found: ${filename}`) };
        }
        return { success: false, error: err }; // Return the actual error object
    }
};
