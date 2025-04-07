"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendOTPInMail = SendOTPInMail;
var Transporter_js_1 = require("./Transporter.js");
var dotenv_1 = require("dotenv");
var MailerConstants_js_1 = require("../../Constants/MailerConstants.js");
dotenv_1.default.config();
var _b = MailerConstants_js_1.mailerContent.otp, OTP_MESSAGE = _b.OTP_MESSAGE, OTP_EXPIRATION_PREFIX = _b.OTP_EXPIRATION_PREFIX, OTP_EXPIRATION_SUFFIX = _b.OTP_EXPIRATION_SUFFIX, IGNORE_EMAIL_MESSAGE = MailerConstants_js_1.mailerContent.messages.IGNORE_EMAIL_MESSAGE, _c = MailerConstants_js_1.mailerContent.verification, EMAIL_VERIFICATION_HEADING = _c.EMAIL_VERIFICATION_HEADING, VERIFY_EMAIL_SUBJECT = _c.VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_BUTTON_TEXT = _c.VERIFY_EMAIL_BUTTON_TEXT, VERIFICATION_LINK_BASE = _c.VERIFICATION_LINK_BASE, EMAIL_SENT_SUCCESSFULLY_MESSAGE = _c.EMAIL_SENT_SUCCESSFULLY_MESSAGE;
function SendOTPInMail(otp, toEmail) {
    return __awaiter(this, void 0, void 0, function () {
        var verificationLink, emailContent, mailOptions, data, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("VERIFY_EMAIL_SUBJECT>>>>>", VERIFY_EMAIL_SUBJECT);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    verificationLink = "".concat(VERIFICATION_LINK_BASE, "?email=").concat(encodeURIComponent(toEmail), "&otp=").concat(otp);
                    emailContent = "\n          <h2>".concat(EMAIL_VERIFICATION_HEADING, "</h2>\n          <p>").concat(OTP_MESSAGE, "<strong>").concat(otp, "</strong></p>\n          <p>").concat(OTP_EXPIRATION_PREFIX, "<strong>30").concat(OTP_EXPIRATION_SUFFIX, "</strong>.</p>\n          <a href=\"").concat(verificationLink, "\" style=\"padding: 10px 15px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;\">\n            ").concat(VERIFY_EMAIL_BUTTON_TEXT, "\n          </a>\n          <p>").concat(IGNORE_EMAIL_MESSAGE, "</p>\n        ");
                    mailOptions = {
                        to: toEmail,
                        subject: VERIFY_EMAIL_SUBJECT,
                        htmlContent: emailContent,
                    };
                    return [4 /*yield*/, (0, Transporter_js_1.Transporter)(mailOptions)];
                case 2:
                    data = _b.sent();
                    return [2 /*return*/, data];
                case 3:
                    e_1 = _b.sent();
                    return [2 /*return*/, { success: false, error: e_1.message }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
