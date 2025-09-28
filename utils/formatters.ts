
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
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

const BELOW_TWENTY = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

const convertBelowThousand = (num: number): string => {
  const words: string[] = [];

  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    words.push(`${BELOW_TWENTY[hundreds]} hundred`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      words.push(BELOW_TWENTY[remainder]);
    } else {
      const tensIndex = Math.floor(remainder / 10);
      const units = remainder % 10;
      if (units > 0) {
        words.push(`${TENS[tensIndex]}-${BELOW_TWENTY[units]}`);
      } else {
        words.push(TENS[tensIndex]);
      }
    }
  }

  return words.join(' ');
};

const convertNumberToWords = (num: number): string => {
  if (num === 0) return BELOW_TWENTY[0];

  const segments: string[] = [];

  const crore = Math.floor(num / 10000000);
  if (crore > 0) {
    segments.push(`${convertNumberToWords(crore)} crore`);
    num %= 10000000;
  }

  const lakh = Math.floor(num / 100000);
  if (lakh > 0) {
    segments.push(`${convertNumberToWords(lakh)} lakh`);
    num %= 100000;
  }

  const thousand = Math.floor(num / 1000);
  if (thousand > 0) {
    segments.push(`${convertNumberToWords(thousand)} thousand`);
    num %= 1000;
  }

  if (num > 0) {
    segments.push(convertBelowThousand(num));
  }

  return segments.join(' ');
};

export const amountToWords = (amount: number): string => {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return '';
  }

  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);

  const rupees = Math.floor(absoluteAmount);
  const paise = Math.round((absoluteAmount - rupees) * 100);

  const rupeeLabel = rupees === 1 ? 'rupee' : 'rupees';
  const paiseLabel = 'paise';

  let sentence = '';

  if (rupees > 0) {
    sentence = `${rupeeLabel} ${convertNumberToWords(rupees)}`;
  } else if (paise > 0) {
    sentence = `${rupeeLabel} zero`;
  } else {
    sentence = `${rupeeLabel} zero`;
  }

  if (paise > 0) {
    sentence = `${sentence} and ${convertNumberToWords(paise)} ${paiseLabel}`;
  }

  sentence = `${sentence} only`;

  if (isNegative) {
    sentence = `minus ${sentence}`;
  }

  const normalized = sentence.replace(/\s+/g, ' ').trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
