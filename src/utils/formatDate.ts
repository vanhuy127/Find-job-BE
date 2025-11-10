export const parseDate = (dateString: string) => {
  const [day, month, year] = dateString.split("-");
  return new Date(
    Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0)
  );
};

export const DATE_SETTINGS = {
  todayStart: new Date(new Date().setHours(0, 0, 0, 0)),
  todayEnd: new Date(new Date().setHours(23, 59, 59, 999)),
};
