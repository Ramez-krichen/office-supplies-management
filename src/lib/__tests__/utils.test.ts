import {
  cn,
  hashPassword,
  verifyPassword,
  formatCurrency,
  formatDate,
  generateOrderNumber
} from '../utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'text-sm')).toBe('px-2 py-1 text-sm');
    });

    it('should handle conditional classes', () => {
      expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
      expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
    });

    it('should handle Tailwind conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword.startsWith('$2b$12$')).toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashedPassword = await hashPassword('test');
      
      const isValid = await verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format a number to a currency string', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers', () => {
      expect(formatCurrency(-50.25)).toBe('-$50.25');
    });

    it('should format large numbers', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.1)).toBe('$10.10');
      expect(formatCurrency(10)).toBe('$10.00');
    });
  });

  describe('formatDate', () => {
    it('should format a date to a date string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      expect(formatDate(date)).toBe('Jan 1, 2024');
    });

    it('should format different months correctly', () => {
      const date = new Date('2024-12-25T00:00:00.000Z');
      expect(formatDate(date)).toBe('Dec 25, 2024');
    });

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29T00:00:00.000Z');
      expect(formatDate(date)).toBe('Feb 29, 2024');
    });

    it('should format current date', () => {
      const now = new Date();
      const formatted = formatDate(now);
      expect(formatted).toMatch(/^[A-Za-z]{3} \d{1,2}, \d{4}$/);
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate a valid order number', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^PO-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should generate unique order numbers', () => {
      const orderNumber1 = generateOrderNumber();
      const orderNumber2 = generateOrderNumber();
      
      expect(orderNumber1).not.toBe(orderNumber2);
    });

    it('should always start with PO-', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber.startsWith('PO-')).toBe(true);
    });

    it('should contain uppercase letters and numbers only', () => {
      const orderNumber = generateOrderNumber();
      const parts = orderNumber.split('-');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('PO');
      expect(parts[1]).toMatch(/^[A-Z0-9]+$/);
      expect(parts[2]).toMatch(/^[A-Z0-9]+$/);
    });
  });
});
