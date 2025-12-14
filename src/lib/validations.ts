import { z } from 'zod';

// ======================
// Product Validation
// ======================
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Product name is required" })
    .max(100, { message: "Product name must be less than 100 characters" }),
  category: z.string()
    .trim()
    .min(1, { message: "Category is required" }),
  price: z.string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number"
    })
    .refine((val) => parseFloat(val) <= 99999.99, {
      message: "Price must be less than €100,000"
    }),
  description: z.string()
    .trim()
    .max(2000, { message: "Description must be less than 2000 characters" })
    .optional()
    .default(''),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ======================
// Comment Validation
// ======================
export const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be less than 1000 characters" }),
});

export type CommentFormData = z.infer<typeof commentSchema>;

// ======================
// Support Ticket Validation
// ======================
export const supportTicketSchema = z.object({
  type: z.enum(['support', 'report_product', 'report_user'], {
    errorMap: () => ({ message: "Invalid ticket type" })
  }),
  subject: z.string()
    .trim()
    .min(1, { message: "Subject is required" })
    .max(200, { message: "Subject must be less than 200 characters" }),
  message: z.string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(2000, { message: "Message must be less than 2000 characters" }),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

// ======================
// Profile Validation
// ======================
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .max(100, { message: "Name must be less than 100 characters" })
    .optional()
    .default(''),
  bio: z.string()
    .trim()
    .max(500, { message: "Bio must be less than 500 characters" })
    .optional()
    .default(''),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ======================
// Project Validation
// ======================
export const projectSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Project name is required" })
    .max(100, { message: "Project name must be less than 100 characters" }),
  description: z.string()
    .trim()
    .max(500, { message: "Description must be less than 500 characters" })
    .optional()
    .default(''),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ======================
// Seller Request Validation
// ======================
export const sellerRequestSchema = z.object({
  brandName: z.string()
    .trim()
    .min(2, { message: "Brand name must be at least 2 characters" })
    .max(50, { message: "Brand name must be less than 50 characters" }),
  motivation: z.string()
    .trim()
    .min(20, { message: "Please provide more details (at least 20 characters)" })
    .max(1000, { message: "Motivation must be less than 1000 characters" }),
});

export type SellerRequestFormData = z.infer<typeof sellerRequestSchema>;

// ======================
// Utility function for validation
// ======================
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  
  return { success: false, errors };
}
