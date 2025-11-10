export const normalizeUUID = (str: string): string | null => {
  // Lọc lấy ký tự chữ và số (phòng trường hợp có khoảng trắng)
  const raw = str.replace(/[^a-zA-Z0-9]/g, "");

  if (raw.length !== 32) return null; // không phải uuid hợp lệ

  return raw.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
};
