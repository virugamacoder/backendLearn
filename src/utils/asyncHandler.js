const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

export { asyncHandler };

// const asyncHandler2 = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     res.staus(err.code || 500).json({
//       success: false,
//       message: err.message || "Server Error",
//     });
//   }
// };
