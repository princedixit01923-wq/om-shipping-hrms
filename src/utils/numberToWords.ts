/**
 * Utility to convert Indian currency number to words
 * Example: 22000 -> TWENTY TWO THOUSAND ONLY
 */
export function convertNumberToWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) {
    return 'ZERO ONLY';
  }

  const ones = [
    '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
  ];

  const tens = [
    '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
  ];

  const helper = (n: number): string => {
    let str = '';
    if (n >= 10000000) {
      str += helper(Math.floor(n / 10000000)) + ' CRORE ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += helper(Math.floor(n / 100000)) + ' LAKH ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += helper(Math.floor(n / 1000)) + ' THOUSAND ';
      n %= 1000;
    }
    if (n >= 100) {
      str += helper(Math.floor(n / 100)) + ' HUNDRED ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += ones[n] + ' ';
      } else {
        str += tens[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) {
          str += ones[n % 10] + ' ';
        }
      }
    }
    return str.trim();
  };

  const integerPart = Math.floor(amount);
  const result = helper(integerPart);
  return (result ? result : 'ZERO') + ' ONLY';
}
