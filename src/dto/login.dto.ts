// import { z } from 'zod';

// export const loginSchema = z.object({
//   email: z.string().email('Invalid email format'),
//   password: z.string().min(1, 'Password required')
// });

// export type LoginDto = z.infer<typeof loginSchema>;



import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required')
});

export type LoginDto = z.infer<typeof loginSchema>;
