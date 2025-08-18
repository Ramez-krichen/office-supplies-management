import { formatCurrency, formatDate, generateOrderNumber } from '../utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format a number to a currency string', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
    });
  });

  describe('formatDate', () => {
    it('should format a date to a date string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      // The expected value may vary based on the timezone of the test environment.
      // This test is written with the expectation of a UTC environment.
      expect(formatDate(date)).toBe('Jan 1, 2024');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate a valid order number', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^PO-[A-Z0-9]+-[A-Z0-9]+$/);
    });
  });
});
