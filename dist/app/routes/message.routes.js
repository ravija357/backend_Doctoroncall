"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const message_controller_1 = require("../controllers/message.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
router.get('/contacts', auth_middleware_1.authMiddleware, message_controller_1.getContacts);
router.get('/unread-count', auth_middleware_1.authMiddleware, message_controller_1.getUnreadCount);
router.put('/read/:senderId', auth_middleware_1.authMiddleware, message_controller_1.markAsRead);
router.post('/upload', auth_middleware_1.authMiddleware, upload_middleware_1.upload.single('file'), message_controller_1.uploadFile);
router.get('/:id', auth_middleware_1.authMiddleware, message_controller_1.getMessages);
exports.default = router;
