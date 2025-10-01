import { formatPrice, formatDate } from '../utils'

describe('utils', () => {
  describe('formatPrice', () => {
    it('should format price in DKK by default', () => {
      expect(formatPrice(150000)).toBe('1.500,00 kr.')
    })

    it('should format price with custom currency', () => {
      expect(formatPrice(150000, 'USD')).toBe('$1,500.00')
    })

    it('should handle zero amount', () => {
      expect(formatPrice(0)).toBe('0,00 kr.')
    })

    it('should handle large amounts', () => {
      expect(formatPrice(123456789)).toBe('1.234.567,89 kr.')
    })
  })

  describe('formatDate', () => {
    it('should format date string', () => {
      const date = '2024-01-15T10:30:00Z'
      expect(formatDate(date)).toBe('15. januar 2024')
    })

    it('should format Date object', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('15. januar 2024')
    })

    it('should handle different months', () => {
      const date = '2024-12-25T10:30:00Z'
      expect(formatDate(date)).toBe('25. december 2024')
    })
  })
})
