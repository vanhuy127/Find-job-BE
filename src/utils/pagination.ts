export const calculationSkip = (page: number, size: number) => {
  return (page - 1) * size;
};

export const calculationTotalPages = (totalRecord: number, size: number) => {
  return Math.ceil(totalRecord / size);
};
