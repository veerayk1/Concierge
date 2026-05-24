/**
 * Form primitives — typed, validated input components for common data shapes.
 *
 * Every form in Concierge should use these primitives instead of raw
 * <input> or even the generic <Input> for typed fields. See
 * docs/QUALITY-BAR.md Section A for the rationale.
 */

export { EmailField } from './EmailField';
export { PhoneField } from './PhoneField';
export { PostalCodeField } from './PostalCodeField';
export { AddressField } from './AddressField';
export type { AddressSuggestion, AddressComponents } from './AddressField';
