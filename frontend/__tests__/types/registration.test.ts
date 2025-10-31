/**
 * Registration Types and Validation Tests
 */

import { registrationSchema, calculatePasswordStrength, PasswordStrength } from '../../src/types/registration';

describe('Registration Schema Validation', () => {
  const validData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'ValidPass123!',
    confirm_password: 'ValidPass123!',
  };

  it('validates correct data successfully', () => {
    const result = registrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe('Username Validation', () => {
    it('rejects username that is too short', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        username: 'ab',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('rejects username that is too long', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        username: 'a'.repeat(31),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 30 characters');
      }
    });

    it('rejects username with invalid characters', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        username: 'invalid-username!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letters, numbers, and underscores');
      }
    });

    it('accepts valid username formats', () => {
      const validUsernames = ['user123', 'User_Name', 'test_user_123'];
      
      validUsernames.forEach(username => {
        const result = registrationSchema.safeParse({
          ...validData,
          username,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Email Validation', () => {
    it('rejects invalid email formats', () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test.example.com'];
      
      invalidEmails.forEach(email => {
        const result = registrationSchema.safeParse({
          ...validData,
          email,
        });
        expect(result.success).toBe(false);
      });
    });

    it('converts email to lowercase', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        email: 'TEST@EXAMPLE.COM',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('Password Validation', () => {
    it('rejects password that is too short', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        password: 'Short1!',
        confirm_password: 'Short1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('rejects password without uppercase letter', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        password: 'lowercase123!',
        confirm_password: 'lowercase123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase letter');
      }
    });

    it('rejects password without lowercase letter', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        password: 'UPPERCASE123!',
        confirm_password: 'UPPERCASE123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase letter');
      }
    });

    it('rejects password without number', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        password: 'NoNumbers!',
        confirm_password: 'NoNumbers!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('number');
      }
    });

    it('rejects password without special character', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        password: 'NoSpecial123',
        confirm_password: 'NoSpecial123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('special character');
      }
    });
  });

  describe('Password Confirmation', () => {
    it('rejects when passwords do not match', () => {
      const result = registrationSchema.safeParse({
        ...validData,
        confirm_password: 'DifferentPass123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('do not match');
        expect(result.error.issues[0].path).toContain('confirm_password');
      }
    });
  });
});

describe('Password Strength Calculator', () => {
  it('correctly identifies weak passwords', () => {
    const weakPasswords = ['weak', 'password', '123456'];
    
    weakPasswords.forEach(password => {
      const strength = calculatePasswordStrength(password);
      expect(strength.level).toBe(PasswordStrength.WEAK);
      expect(strength.requirements.length).toBeGreaterThan(0);
    });
  });

  it('correctly identifies strong passwords', () => {
    const strongPasswords = ['StrongPass123!', 'MySecure@Pass1', 'Complex$Password9'];
    
    strongPasswords.forEach(password => {
      const strength = calculatePasswordStrength(password);
      expect(strength.level).toBe(PasswordStrength.STRONG);
      expect(strength.requirements).toHaveLength(0);
    });
  });

  it('provides appropriate feedback for missing requirements', () => {
    const strength = calculatePasswordStrength('weak');
    
    expect(strength.requirements).toContain('At least 8 characters');
    expect(strength.requirements).toContain('Uppercase letter');
    expect(strength.requirements).toContain('Number');
    expect(strength.requirements).toContain('Special character');
  });

  it('correctly tracks requirement completion', () => {
    const tests = [
      { password: 'weakpass', expectedMissing: 3 }, // missing: uppercase, number, special
      { password: 'Weakpass', expectedMissing: 2 }, // missing: number, special  
      { password: 'Weakpass1', expectedMissing: 1 }, // missing: special
      { password: 'Weakpass1!', expectedMissing: 0 }, // all requirements met
    ];

    tests.forEach(({ password, expectedMissing }) => {
      const strength = calculatePasswordStrength(password);
      expect(strength.requirements).toHaveLength(expectedMissing);
    });
  });
});