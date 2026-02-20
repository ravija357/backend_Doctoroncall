"use strict";
// import { z } from 'zod';
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = void 0;
// export const loginSchema = z.object({
//   email: z.string().email('Invalid email format'),
//   password: z.string().min(1, 'Password required')
// });
// export type LoginDto = z.infer<typeof loginSchema>;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password required'),
    role: zod_1.z.string().optional()
});
