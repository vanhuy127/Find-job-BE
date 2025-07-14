export const parseDate = (dateString: string, format: string) => {
  const [day, month, year] = dateString.split("-");
  return new Date(
    Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0)
  );
};
