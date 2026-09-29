/**
 * Grocery Choice Customer App - Formatters
 */

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  return `₹${num.toFixed(num % 1 === 0 ? 0 : 2)}`;
}

export function formatUnit(unit: string | undefined | null): string {
  if (!unit) return '1 pc';
  const u = unit.trim().toUpperCase();
  switch (u) {
    case 'PIECE':
    case 'PC':
      return '1 pc';
    case 'KG':
      return '1 kg';
    case 'GM':
    case 'G':
      return '500 g';
    case 'LTR':
    case 'L':
      return '1 L';
    case 'ML':
      return '500 ml';
    case 'PACK':
    case 'PKT':
      return '1 pack';
    case 'BUNCH':
      return '1 bunch';
    default:
      return unit;
  }
}

export function calculateDiscount(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function formatOrderNumber(orderNumber: string | undefined | null): string {
  if (!orderNumber) return '#GC-0000';
  return orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
}
