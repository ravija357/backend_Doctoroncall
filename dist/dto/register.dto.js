"use strict";
// import { z } from 'zod';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
// export const registerSchema = z.object({
//   email: z.string().email('Invalid email format'),
//   password: z.string().min(6, 'Password must be at least 6 characters')
// });
// export type RegisterDto = z.infer<typeof registerSchema>;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters')
});
