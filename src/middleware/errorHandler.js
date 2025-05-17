export const errorHandler = (err, req, res, next) => {
  console.error("Caught error:", err); // 🔥 critical for debugging

  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || null;

  res.status(status).json({
    status: "error",
    message,
    errors,
  });
};
