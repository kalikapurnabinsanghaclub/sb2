/**
 * Robust Multi-Bank & App UPI Notification/SMS Parser
 * Extracts: Order ID, Amount, and UTR / Reference number
 */

export function parsePaymentNotification(text) {
  if (!text || typeof text !== 'string') {
    return { success: false, reason: 'Empty or invalid input text' };
  }

  const cleanText = text.replace(/[\r\n]+/g, ' ').trim();

  // 1. Extract Order ID / Reference (Default format: DON-XXXXXX or custom prefixes)
  const orderRegex = /(DON-[A-Z0-9]{4,12})/i;
  const orderMatch = cleanText.match(orderRegex);
  const orderId = orderMatch ? orderMatch[1].toUpperCase() : null;

  // 2. Extract Amount (Supports \u20B9, Rs., Rs, INR, with optional decimals and commas e.g., 1,500.50)
  const amountRegexes = [
    /(?:credited\s*(?:with|by)?|received|paid)\s*(?:Rs\.?|INR|\u20B9|INR\s*)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Rs\.?|INR|\u20B9)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:is\s*credited|credited|received)/i,
    /(?:Rs\.?|INR|\u20B9)\s*([\d,]+(?:\.\d{1,2})?)/i
  ];

  let amount = null;
  for (const regex of amountRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        amount = num;
        break;
      }
    }
  }

  // 3. Extract 12-digit UPI UTR / Transaction Reference Number
  const utrRegexes = [
    /(?:UTR|UPI\s*Ref(?:erence)?(?:\s*No)?|Txn\s*ID|Ref(?:\s*No)?|UPI(?:\/CR)?)[-:\/\s]*([0-9]{12})/i,
    /\b([0-9]{12})\b/
  ];

  let utr = null;
  for (const regex of utrRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      utr = match[1];
      break;
    }
  }

  // 4. Validate if this is a credit notification (ignoring debit SMS)
  const isDebit = /\b(debited|sent|withdrawn|transferred to|spent)\b/i.test(cleanText);
  const isCredit = /\b(credited|received|deposit|deposited)\b/i.test(cleanText) || (amount !== null && orderId !== null);

  if (isDebit && !/\b(credited|received)\b/i.test(cleanText)) {
    return {
      success: false,
      reason: 'Debit notification ignored'
    };
  }

  return {
    success: orderId !== null || amount !== null,
    orderId,
    amount,
    utr: utr || 'N/A',
    rawText: cleanText,
    isCredit: Boolean(isCredit)
  };
}