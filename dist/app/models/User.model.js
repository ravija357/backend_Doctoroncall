"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, default: 'user' },
    image: { type: String, default: null },
});
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcryptjs_1.default.hash(this.password, 10);
    }
});
userSchema.methods.comparePassword = function (password) {
    return bcryptjs_1.default.compare(password, this.password);
};
exports.default = mongoose_1.default.model('User', userSchema);
