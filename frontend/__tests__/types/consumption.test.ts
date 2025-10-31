/**
 * Consumption Types Tests
 */

import {
  isValidConsumptionType,
  getConsumptionTypeLabel,
  getConsumptionTypeOptions,
} from '../../src/types/consumption';

describe('Consumption Types', () => {
  describe('isValidConsumptionType', () => {
    it('returns true for valid consumption types', () => {
      expect(isValidConsumptionType('electricity')).toBe(true);
      expect(isValidConsumptionType('water')).toBe(true);
      expect(isValidConsumptionType('gas')).toBe(true);
    });

    it('returns false for invalid consumption types', () => {
      expect(isValidConsumptionType('invalid')).toBe(false);
      expect(isValidConsumptionType('oil')).toBe(false);
      expect(isValidConsumptionType('')).toBe(false);
      expect(isValidConsumptionType('ELECTRICITY')).toBe(false); // Case sensitive
    });
  });

  describe('getConsumptionTypeLabel', () => {
    it('returns correct labels for consumption types', () => {
      expect(getConsumptionTypeLabel('electricity')).toBe('Electricity');
      expect(getConsumptionTypeLabel('water')).toBe('Water');
      expect(getConsumptionTypeLabel('gas')).toBe('Gas');
    });
  });

  describe('getConsumptionTypeOptions', () => {
    it('returns all consumption type options with correct structure', () => {
      const options = getConsumptionTypeOptions();
      
      expect(options).toHaveLength(3);
      expect(options).toEqual([
        { value: 'electricity', label: 'Electricity' },
        { value: 'water', label: 'Water' },
        { value: 'gas', label: 'Gas' },
      ]);
    });

    it('returns options in consistent order', () => {
      const options1 = getConsumptionTypeOptions();
      const options2 = getConsumptionTypeOptions();
      
      expect(options1).toEqual(options2);
    });
  });
});