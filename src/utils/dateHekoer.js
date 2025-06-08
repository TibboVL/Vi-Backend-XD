export const getUTCDateOnly = (date, offsetDays) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + offsetDays,
      0,
      0,
      0,
      0
    )
  );
