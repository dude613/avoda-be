import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';

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
const filesDirectory = path.join(__dirname, '../../uploads');

if (!fs.existsSync(filesDirectory)) {
    fs.mkdirSync(filesDirectory, { recursive: true });
}

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ): void => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
            null,
            false
        );
    }
    cb(null, true);
};

type DestinationCallback = (error: Error | null, destination: string) => void;
type FilenameCallback = (error: Error | null, filename: string) => void;

const storage: StorageEngine = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        cb: DestinationCallback
    ): void => {
        cb(null, filesDirectory);
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        cb: FilenameCallback
    ): void => {
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

const deleteImages = (): void => {
    if (fs.existsSync(filesDirectory)) {
        fs.readdir(filesDirectory, (err: NodeJS.ErrnoException | null, files: string[]) => {
            if (err) {
                console.error('Could not list the directory.', err);
                return;
            }
            files.forEach((file: string) => {
                const filePath = path.join(filesDirectory, file);
                fs.unlink(filePath, (err: NodeJS.ErrnoException | null) => {
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

const deleteImage = (file: string): Promise<any> => {
    const filePath = path.join(filesDirectory, file);
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err: NodeJS.ErrnoException | null) => {
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
