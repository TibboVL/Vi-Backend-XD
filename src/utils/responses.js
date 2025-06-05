export const sendSuccess = (
  res,
  {
    data = null,
    message = "Success",
    statusCode = 200,
    meta = { itemCount: null },
  } = {}
) => {
  const response = {
    status: "success",
    meta: {
      ...meta,
      itemCount: meta.itemCount ? meta.itemCount : data.length,
    },
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
