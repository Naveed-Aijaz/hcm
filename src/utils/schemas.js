import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Valid email is required').max(254);
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email,
  password,
  company: z.string().trim().max(120).optional().default(''),
}); // NOTE: "role" is intentionally NOT accepted from public signup

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

export const leaveSchema = z
  .object({
    leaveType: z.enum(['Casual', 'Sick', 'Annual']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().trim().min(3, 'Reason is required').max(1000),
  })
  .refine((d) => d.endDate >= d.startDate, { message: 'End date cannot be before start date', path: ['endDate'] });

export const leaveStatusSchema = z.object({ status: z.enum(['Approved', 'Rejected']) });

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
  role: z.enum(['Admin', 'HR', 'Employee']).default('Employee'),
  department: z.string().trim().max(80).optional(),
  designation: z.string().trim().max(80).optional(),
  salary: z.object({ basic: z.number().min(0), allowances: z.number().min(0).default(0) }).optional(),
});

export const updateUserSchema = z
  .object({
    role: z.enum(['Admin', 'HR', 'Employee']).optional(),
    isActive: z.boolean().optional(),
    department: z.string().trim().max(80).optional(),
    designation: z.string().trim().max(80).optional(),
    salary: z.object({ basic: z.number().min(0), allowances: z.number().min(0).default(0) }).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No fields to update' });

export const payrollSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(20),
});
