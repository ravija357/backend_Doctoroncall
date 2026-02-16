"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('3001'),
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: zod_1.z.string().min(1, 'JWT_SECRET is required'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
});
const envVars = envSchema.safeParse(process.env);
if (!envVars.success) {
    console.error('❌ Invalid environment variables:', envVars.error.format());
    process.exit(1);
}
exports.env = envVars.data;
