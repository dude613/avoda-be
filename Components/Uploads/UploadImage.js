"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.deleteImages = exports.uploadImages = void 0;
var multer_1 = require("multer");
var path_1 = require("path");
var url_2 = require("url");
var path_2 = require("path");
var fs_2 = require("fs");
var crypto_2 = require("crypto");
var ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/svg+xml',
    'image/webp',
    'image/avif',
];
var __filename = (0, url_2.fileURLToPath)(import.meta.url);
var __dirname = (0, path_2.dirname)(__filename);
var filesDirectory = path_1.default.join(__dirname, '../../uploads');
if (!fs_2.default.existsSync(filesDirectory)) {
    fs_2.default.mkdirSync(filesDirectory, { recursive: true });
}
var fileFilter = function (req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only PNG, JPG, JPEG, SVG, WEBP, and AVIF are allowed.'), false);
    }
    cb(null, true);
};
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, filesDirectory);
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = "".concat(Date.now(), "-").concat(crypto_2.default.randomBytes(6).toString('hex'));
        var ext = path_1.default.extname(file.originalname);
        cb(null, "".concat(uniqueSuffix).concat(ext));
    },
});
var upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});
var uploadImages = upload.fields([
    { name: 'images', maxCount: 10 },
]);
exports.uploadImages = uploadImages;
var deleteImages = function () {
    if (fs_2.default.existsSync(filesDirectory)) {
        fs_2.default.readdir(filesDirectory, function (err, files) {
            if (err) {
                console.error('Could not list the directory.', err);
                return;
            }
            files.forEach(function (file) {
                var filePath = path_1.default.join(filesDirectory, file);
                fs_2.default.unlink(filePath, function (err) {
                    if (err) {
                        console.error("Failed to delete file: ".concat(file), err);
                    }
                    else {
                        console.log("Deleted file: ".concat(file));
                    }
                });
            });
        });
    }
};
exports.deleteImages = deleteImages;
var deleteImage = function (file) {
    var filePath = path_1.default.join(filesDirectory, file);
    return new Promise(function (resolve, reject) {
        fs_2.default.unlink(filePath, function (err) {
            if (err) {
                console.error("Failed to delete file: ".concat(file), err);
                reject({ error: err });
            }
            else {
                console.log("Deleted file: ".concat(file));
                resolve({ error: false });
            }
        });
    });
};
exports.deleteImage = deleteImage;
