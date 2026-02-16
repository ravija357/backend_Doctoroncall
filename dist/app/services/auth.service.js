"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_repository_1 = require("../repositories/auth.repository");
class AuthService {
    constructor() {
        this.repo = new auth_repository_1.AuthRepository();
    }
    async register(data) {
        const existingUser = await this.repo.findByEmail(data.email);
        if (existingUser) {
            throw new Error('Email already exists');
        }
        const user = await this.repo.create(data);
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            token
        };
    }
    async login(data) {
        const user = await this.repo.findByEmail(data.email);
        if (!user || !(await user.comparePassword(data.password))) {
            throw new Error('Invalid email or password');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return {
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            },
            token
        };
    }
}
exports.AuthService = AuthService;
