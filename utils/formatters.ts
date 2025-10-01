
const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatInrWithPrefix = (amount: number, prefix: string): string => {
  const isNegative = amount < 0;
  const formattedNumber = INR_FORMATTER.format(Math.abs(amount));
  return `${isNegative ? '-' : ''}${prefix}${formattedNumber}`;
};

export const formatINR = (amount: number): string => {
  return formatInrWithPrefix(amount, '₹');
};

export const formatINRPdfSafe = (amount: number): string => {
  return formatInrWithPrefix(amount, 'Rs ');
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getTodayDateString = (): string => {
    return new Date().toISOString().split('T')[0];
}

export const formatWeight = (kg: number): string => {
    return `${kg.toFixed(2)} kg`;
}
