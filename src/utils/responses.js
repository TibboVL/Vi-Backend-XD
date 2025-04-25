export const sendSuccess = (
  res,
  { data = null, message = "Success", statusCode = 200 } = {}
) => {
  const response = {
    status: "success",
    message,
    data,
  };

  return res.status(statusCode).json(response);
};

export const sendError = (
  res,
  { message = "An error occurred", statusCode = 500, errors = null } = {}
) => {
  const response = {
    status: "error",
    message,
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};
