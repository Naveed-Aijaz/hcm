// Reusable Zod validation middleware (Zod v4: issues, not errors).
export function validate(schema) {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body ?? {});
      next();
    } catch (error) {
      const issues = error.issues || [];
      return res.status(400).json({
        success: false,
        message: issues[0]?.message || 'Validation failed',
        errors: issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
  };
}
