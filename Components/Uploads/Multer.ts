import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import { Request } from 'express'; // Import Request type
import fs from 'fs'; // Import fs for directory creation

// Define the destination directory
const uploadDir = 'uploads/'; // Changed destination to just 'uploads/' as subdirs are handled below
const imagesSubDir = 'images'; // Define subdirectory for images
const fullImagesPath = path.join(uploadDir, imagesSubDir);

// Ensure the upload directory and subdirectory exist
// Use synchronous operations during setup phase is generally acceptable
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(fullImagesPath)) {
    fs.mkdirSync(fullImagesPath);
}


// Configure disk storage
const storage: StorageEngine = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        // Save images to the specific subdirectory
        cb(null, fullImagesPath);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // Generate a unique filename (timestamp + original extension)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Add random element
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// Define the file filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']; // Added webp
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        // Reject file with a specific error message
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.'));
    }
};

// Create the multer instance with configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
});

// Export the configured multer instance
export default upload;
