/**
 * SMS Notification Service Tests — TDD
 *
 * Tests for Twilio-based SMS delivery via fetch.
 * All tests mock global fetch — no real API calls.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock logger before importing the module under test
// ---------------------------------------------------------------------------

const mockLoggerInfo = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: mockLoggerInfo,
    warn: mockLoggerWarn,
    error: mockLoggerError,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function twilioSuccessResponse(sid: string) {
  return new Response(JSON.stringify({ sid }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

function twilioErrorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ code: 21211, message, status }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SMS Service', () => {
  const originalEnv = { ...process.env };
  let sendSms: typeof import('@/server/sms').sendSms;
  let sendBulkSms: typeof import('@/server/sms').sendBulkSms;
  let formatPhoneNumber: typeof import('@/server/sms').formatPhoneNumber;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());

    // Set Twilio env vars for most tests
    process.env.TWILIO_ACCOUNT_SID = 'ACtest1234567890abcdef1234567890';
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token_abcdef1234567890';
    process.env.TWILIO_FROM_NUMBER = '+15551234567';

    // Re-import module fresh to pick up env changes
    vi.resetModules();
    const smsModule = await import('@/server/sms');
    sendSms = smsModule.sendSms;
    sendBulkSms = smsModule.sendBulkSms;
    formatPhoneNumber = smsModule.formatPhoneNumber;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. sendSms calls Twilio API with correct params
  // -------------------------------------------------------------------------

  describe('sendSms', () => {
    it('calls Twilio API with correct params and returns message SID on success', async () => {
      const mockFetch = vi.fn().mockResolvedValue(twilioSuccessResponse('SM1234567890'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms({ to: '+14165551234', body: 'Your package is ready' });

      expect(result).toBe('SM1234567890');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0]!;
      expect(url).toBe(
        'https://api.twilio.com/2010-04-01/Accounts/ACtest1234567890abcdef1234567890/Messages.json',
      );
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

      // Verify Basic auth header
      const expectedAuth = Buffer.from(
        'ACtest1234567890abcdef1234567890:test_auth_token_abcdef1234567890',
      ).toString('base64');
      expect(options.headers['Authorization']).toBe(`Basic ${expectedAuth}`);

      // Verify form body params
      const bodyParams = new URLSearchParams(options.body);
      expect(bodyParams.get('To')).toBe('+14165551234');
      expect(bodyParams.get('From')).toBe('+15551234567');
      expect(bodyParams.get('Body')).toBe('Your package is ready');
    });

    // -----------------------------------------------------------------------
    // 2. Returns null on failure
    // -----------------------------------------------------------------------

    it('returns null when Twilio API returns an error', async () => {
      const mockFetch = vi.fn().mockResolvedValue(twilioErrorResponse(400, 'Invalid phone number'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms({ to: '+14165551234', body: 'Hello' });

      expect(result).toBeNull();
      expect(mockLoggerError).toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // 3. Handles missing TWILIO_ACCOUNT_SID gracefully (dev mode)
    // -----------------------------------------------------------------------

    it('logs and returns null when TWILIO_ACCOUNT_SID is not set (dev mode)', async () => {
      process.env.TWILIO_ACCOUNT_SID = '';
      process.env.TWILIO_AUTH_TOKEN = '';
      process.env.TWILIO_FROM_NUMBER = '';

      vi.resetModules();
      const smsModule = await import('@/server/sms');

      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const result = await smsModule.sendSms({ to: '+14165551234', body: 'Hello' });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({ to: '+14165551234' }),
        expect.stringContaining('TWILIO_ACCOUNT_SID not set'),
      );
    });

    // -----------------------------------------------------------------------
    // 4. Handles API errors without throwing (logs and returns null)
    // -----------------------------------------------------------------------

    it('catches network errors and returns null without throwing', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms({ to: '+14165551234', body: 'Hello' });

      expect(result).toBeNull();
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.objectContaining({ to: '+14165551234' }),
        expect.stringContaining('Failed to send SMS'),
      );
    });

    // -----------------------------------------------------------------------
    // 6. Validates phone number format (E.164)
    // -----------------------------------------------------------------------

    it('rejects an invalid phone number and returns null', async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms({ to: '5551234', body: 'Hello' });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.objectContaining({ to: '5551234' }),
        expect.stringContaining('Invalid phone number'),
      );
    });

    it('rejects a phone number missing the + prefix', async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms({ to: '14165551234', body: 'Hello' });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('accepts a valid E.164 phone number', async () => {
      const mockFetch = vi.fn().mockResolvedValue(twilioSuccessResponse('SMabc'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendSms({ to: '+14165551234', body: 'Hello' });

      expect(result).toBe('SMabc');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. sendBulkSms sends to multiple recipients
  // -------------------------------------------------------------------------

  describe('sendBulkSms', () => {
    it('sends to multiple recipients and returns array of SIDs', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(twilioSuccessResponse('SM001'))
        .mockResolvedValueOnce(twilioSuccessResponse('SM002'))
        .mockResolvedValueOnce(twilioSuccessResponse('SM003'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendBulkSms({
        to: ['+14165551111', '+14165552222', '+14165553333'],
        body: 'Building update',
      });

      expect(result).toEqual(['SM001', 'SM002', 'SM003']);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('returns null for failed sends while succeeding for others', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(twilioSuccessResponse('SM001'))
        .mockResolvedValueOnce(twilioErrorResponse(400, 'Invalid number'))
        .mockResolvedValueOnce(twilioSuccessResponse('SM003'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendBulkSms({
        to: ['+14165551111', '+14165552222', '+14165553333'],
        body: 'Building update',
      });

      expect(result).toEqual(['SM001', null, 'SM003']);
    });

    // -----------------------------------------------------------------------
    // 8. Handles empty recipient list
    // -----------------------------------------------------------------------

    it('returns empty array for empty recipient list', async () => {
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendBulkSms({ to: [], body: 'Hello' });

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('empty recipient list'));
    });

    it('filters out invalid phone numbers from bulk sends', async () => {
      const mockFetch = vi
        .fn()
        .mockImplementation(() => Promise.resolve(twilioSuccessResponse('SM001')));
      vi.stubGlobal('fetch', mockFetch);

      const result = await sendBulkSms({
        to: ['+14165551111', 'badnumber', '+14165553333'],
        body: 'Hello',
      });

      // Invalid numbers get null, valid ones get SIDs
      expect(result).toEqual(['SM001', null, 'SM001']);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // 9. formatPhoneNumber normalizes Canadian/US numbers to E.164
  // -------------------------------------------------------------------------

  describe('formatPhoneNumber', () => {
    it('returns a valid E.164 number as-is', () => {
      expect(formatPhoneNumber('+14165551234')).toBe('+14165551234');
    });

    it('adds +1 prefix to a 10-digit North American number', () => {
      expect(formatPhoneNumber('4165551234')).toBe('+14165551234');
    });

    it('adds + prefix to an 11-digit number starting with 1', () => {
      expect(formatPhoneNumber('14165551234')).toBe('+14165551234');
    });

    it('normalizes a number with dashes', () => {
      expect(formatPhoneNumber('416-555-1234')).toBe('+14165551234');
    });

    it('normalizes a number with spaces', () => {
      expect(formatPhoneNumber('416 555 1234')).toBe('+14165551234');
    });

    it('normalizes a number with parentheses', () => {
      expect(formatPhoneNumber('(416) 555-1234')).toBe('+14165551234');
    });

    it('normalizes a number with dots', () => {
      expect(formatPhoneNumber('416.555.1234')).toBe('+14165551234');
    });

    it('returns null for a number that is too short', () => {
      expect(formatPhoneNumber('555123')).toBeNull();
    });

    it('returns null for a number that is too long', () => {
      expect(formatPhoneNumber('+1416555123456789')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(formatPhoneNumber('')).toBeNull();
    });

    it('preserves international numbers that are already E.164', () => {
      expect(formatPhoneNumber('+442071234567')).toBe('+442071234567');
    });
  });
});
