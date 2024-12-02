export const formatNumber = (number: number, precision: number) => {
  // Format with fixed decimal places
  const formatted = number.toFixed(precision);

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = formatted.split(".");

  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Only show decimal part if it's not all zeros
  return decimalPart && !decimalPart.match(/^0+$/)
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};
