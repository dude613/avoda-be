import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/svg+xml',
    'image/webp',
    'image/avif',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const filesDirectory = path.join(__dirname, '../uploads');

if (!fs.existsSync(filesDirectory)) {
    fs.mkdirSync(filesDirectory, { recursive: true });
}

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
            new Error('Invalid file type. Only PNG, JPG, JPEG, SVG, WEBP, and AVIF are allowed.'),
            false
        );
    }
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, filesDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});

const uploadImages = upload.fields([
    { name: 'images', maxCount: 10 },
]);

const deleteImages = () => {
    if (fs.existsSync(filesDirectory)) {
        fs.readdir(filesDirectory, (err, files) => {
            if (err) {
                console.error('Could not list the directory.', err);
                return;
            }
            files.forEach((file) => {
                const filePath = path.join(filesDirectory, file);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Failed to delete file: ${file}`, err);
                    } else {
                        console.log(`Deleted file: ${file}`);
                    }
                });
            });
        });
    }
};

const deleteImage = (file) => {
    const filePath = path.join(filesDirectory, file);
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Failed to delete file: ${file}`, err);
                reject({ error: err });
            } else {
                console.log(`Deleted file: ${file}`);
                resolve({ error: false });
            }
        });
    });
};

export { uploadImages, deleteImages, deleteImage };
