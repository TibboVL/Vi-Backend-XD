export const sendSuccess = (
  res,
  { data = null, message = "Success", statusCode = 200, meta = null } = {}
) => {
  const finalMeta = {
    ...meta,
    itemCount:
      meta?.itemCount != null
        ? meta?.itemCount
        : Array.isArray(data)
        ? data.length
        : null,
  };

  const response = {
    status: "success",
    meta: finalMeta,
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res,
  {
    message = "An error occurred",
    statusCode = 500,
    errors = null,
    meta = {},
  } = {}
) => {
  console.warn(message);
  const response = {
    status: "error",
    meta,
    message,
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};
