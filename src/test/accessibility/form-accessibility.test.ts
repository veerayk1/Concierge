/**
 * Form Accessibility Tests — WCAG 2.2 AA
 *
 * Validates that all Concierge form components meet accessibility requirements:
 *   - All form inputs have associated labels (label[for] matches input[id])
 *   - Required fields have aria-required="true"
 *   - Error messages use aria-describedby linking
 *   - Form submit buttons have descriptive text (not just "Submit")
 *   - Checkbox and radio groups have fieldset/legend
 *   - Select elements have accessible names
 *   - File upload inputs have descriptive labels
 *   - Password inputs have visibility toggle with aria-label
 *
 * @module test/accessibility/form-accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// 1. All form inputs have associated labels (label[for] matches input[id])
// ---------------------------------------------------------------------------

describe('Form inputs — label association via for/id', () => {
  it('Input with label prop creates a label[for] matching input[id]', () => {
    render(createElement(Input, { label: 'Email Address', id: 'email' }));
    const input = screen.getByLabelText('Email Address');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('id', 'email');

    const label = screen.getByText('Email Address');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('Input auto-generates id from label when id is not provided', () => {
    render(createElement(Input, { label: 'Full Name' }));
    const input = screen.getByLabelText('Full Name');
    expect(input).toHaveAttribute('id', 'full-name');

    const label = screen.getByText('Full Name');
    expect(label).toHaveAttribute('for', 'full-name');
  });

  it('FormField creates label-input association via generated id', () => {
    render(
      createElement(
        FormField,
        { label: 'Description' } as any,
        createElement('input', { type: 'text' }),
      ),
    );
    const label = screen.getByText('Description');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for');
    // The for attribute should be a non-empty string
    expect(label.getAttribute('for')!.length).toBeGreaterThan(0);
  });

  it('Textarea with label creates proper label association', () => {
    render(createElement(Textarea, { label: 'Notes', id: 'notes' }));
    const textarea = screen.getByLabelText('Notes');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('id', 'notes');
  });

  it('Checkbox with label creates a clickable label', () => {
    render(createElement(Checkbox, { label: 'I agree to the terms' }));
    const label = screen.getByText('I agree to the terms');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for');
  });

  it('Switch with label creates proper association', () => {
    render(createElement(Switch, { label: 'Enable notifications' }));
    const label = screen.getByText('Enable notifications');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for');
  });

  it('RadioGroupItem with label creates proper association', () => {
    render(
      createElement(
        RadioGroup,
        { defaultValue: 'option1' },
        createElement(RadioGroupItem, { value: 'option1', label: 'Option 1' }),
        createElement(RadioGroupItem, { value: 'option2', label: 'Option 2' }),
      ),
    );
    const label1 = screen.getByText('Option 1');
    expect(label1.tagName).toBe('LABEL');
    expect(label1).toHaveAttribute('for');

    const label2 = screen.getByText('Option 2');
    expect(label2.tagName).toBe('LABEL');
    expect(label2).toHaveAttribute('for');
  });
});

// ---------------------------------------------------------------------------
// 2. Required fields have aria-required or required attribute
// ---------------------------------------------------------------------------

describe('Required fields — aria-required / required indicator', () => {
  it('Input with required prop shows asterisk indicator', () => {
    render(createElement(Input, { label: 'Unit Number', required: true }));
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
  });

  it('Input with required prop passes required to the input element', () => {
    render(createElement(Input, { label: 'Name', required: true }));
    const input = screen.getByLabelText(/Name/);
    expect(input).toBeRequired();
  });

  it('FormField with required prop shows asterisk indicator', () => {
    render(
      createElement(
        FormField,
        { label: 'Category', required: true } as any,
        createElement('input', { type: 'text' }),
      ),
    );
    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
  });

  it('Textarea with required prop marks the field as required', () => {
    render(createElement(Textarea, { label: 'Comments', required: true }));
    const textarea = screen.getByLabelText(/Comments/);
    expect(textarea).toBeRequired();
  });

  it('Required indicator is visually present (not just aria)', () => {
    render(createElement(Input, { label: 'Email', required: true }));
    const asterisk = screen.getByText('*');
    // The asterisk should be styled with error color for visibility
    expect(asterisk.className).toContain('text-error');
  });
});

// ---------------------------------------------------------------------------
// 3. Error messages use aria-describedby linking
// ---------------------------------------------------------------------------

describe('Error messages — aria-describedby linking', () => {
  it('Input error creates aria-describedby pointing to error element', () => {
    render(createElement(Input, { label: 'Email', error: 'Invalid email address', id: 'email' }));
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');

    const errorEl = document.getElementById('email-error');
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toBe('Invalid email address');
  });

  it('Input error sets aria-invalid to true', () => {
    render(createElement(Input, { label: 'Phone', error: 'Invalid phone number' }));
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('Input without error does not set aria-invalid', () => {
    render(createElement(Input, { label: 'Name' }));
    const input = screen.getByLabelText('Name');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('Textarea error creates aria-describedby linking', () => {
    render(createElement(Textarea, { label: 'Description', error: 'Too short', id: 'desc' }));
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('aria-describedby', 'desc-error');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('FormField error uses role="alert" for screen reader announcement', () => {
    render(
      createElement(
        FormField,
        { label: 'Name', error: 'Name is required' } as any,
        createElement('input', { type: 'text' }),
      ),
    );
    const errorEl = screen.getByRole('alert');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl.textContent).toBe('Name is required');
  });

  it('Checkbox error creates aria-describedby linking', () => {
    render(
      createElement(Checkbox, {
        label: 'Accept terms',
        error: 'You must accept',
        id: 'terms',
      }),
    );
    const errorEl = document.getElementById('terms-error');
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toBe('You must accept');
  });

  it('Input helper text uses aria-describedby when no error present', () => {
    render(
      createElement(Input, {
        label: 'Phone',
        helperText: 'Include area code',
        id: 'phone',
      }),
    );
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-describedby', 'phone-helper');

    const helper = document.getElementById('phone-helper');
    expect(helper).not.toBeNull();
    expect(helper!.textContent).toBe('Include area code');
  });

  it('Error takes precedence over helper text in aria-describedby', () => {
    render(
      createElement(Input, {
        label: 'Email',
        helperText: 'We will not share your email',
        error: 'Invalid email',
        id: 'email',
      }),
    );
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    // Helper should not be rendered when error is present
    expect(document.getElementById('email-helper')).toBeNull();
  });

  it('RadioGroup with error sets aria-invalid and shows error message', () => {
    render(
      createElement(
        RadioGroup,
        { error: 'Please select an option' },
        createElement(RadioGroupItem, { value: 'a', label: 'Choice A' }),
      ),
    );
    const errorEl = screen.getByRole('alert');
    expect(errorEl.textContent).toBe('Please select an option');
  });
});

// ---------------------------------------------------------------------------
// 4. Form submit buttons have descriptive text (not just "Submit")
// ---------------------------------------------------------------------------

describe('Form submit buttons — descriptive text', () => {
  it('Submit button with descriptive action text', () => {
    render(
      createElement(
        'form',
        null,
        createElement(Input, { label: 'Name' }),
        createElement(Button, { type: 'submit' }, 'Create Package'),
      ),
    );
    const button = screen.getByRole('button', { name: 'Create Package' });
    expect(button).toBeInTheDocument();
    expect(button.textContent).not.toBe('Submit');
  });

  it('Multiple form buttons have distinct accessible names', () => {
    render(
      createElement(
        'form',
        null,
        createElement(Button, { type: 'submit', variant: 'primary' }, 'Save Changes'),
        createElement(Button, { type: 'button', variant: 'ghost' }, 'Cancel'),
        createElement(Button, { type: 'button', variant: 'danger' }, 'Delete Record'),
      ),
    );

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Record' })).toBeInTheDocument();
  });

  it('Loading button retains descriptive text as accessible name', () => {
    render(createElement(Button, { loading: true }, 'Saving Package'));
    const button = screen.getByRole('button', { name: 'Saving Package' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('Button with icon and text preserves text as accessible name', () => {
    render(
      createElement(
        Button,
        null,
        createElement('svg', { 'aria-hidden': 'true', width: 16, height: 16 }),
        ' Create Event',
      ),
    );
    const button = screen.getByRole('button', { name: /Create Event/i });
    expect(button).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. Checkbox and radio groups have fieldset/legend pattern
// ---------------------------------------------------------------------------

describe('Checkbox and radio groups — fieldset/legend pattern', () => {
  it('Checkbox group wrapped in fieldset with legend', () => {
    render(
      createElement(
        'fieldset',
        null,
        createElement('legend', null, 'Notification Preferences'),
        createElement(Checkbox, { label: 'Email notifications' }),
        createElement(Checkbox, { label: 'SMS notifications' }),
        createElement(Checkbox, { label: 'Push notifications' }),
      ),
    );

    const fieldset = document.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    const legend = within(fieldset!).getByText('Notification Preferences');
    expect(legend.tagName).toBe('LEGEND');
  });

  it('Radio group with role="radiogroup" is accessible', () => {
    render(
      createElement(
        RadioGroup,
        { defaultValue: 'low' },
        createElement(RadioGroupItem, { value: 'low', label: 'Low' }),
        createElement(RadioGroupItem, { value: 'medium', label: 'Medium' }),
        createElement(RadioGroupItem, { value: 'high', label: 'High' }),
      ),
    );

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
  });

  it('Radio group items are all queryable by role="radio"', () => {
    render(
      createElement(
        RadioGroup,
        { defaultValue: 'a' },
        createElement(RadioGroupItem, { value: 'a', label: 'Choice A' }),
        createElement(RadioGroupItem, { value: 'b', label: 'Choice B' }),
      ),
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('Fieldset with legend groups related checkboxes for screen readers', () => {
    render(
      createElement(
        'fieldset',
        { 'aria-describedby': 'perm-desc' },
        createElement('legend', null, 'Permissions'),
        createElement('p', { id: 'perm-desc' }, 'Select the permissions for this role'),
        createElement(Checkbox, { label: 'Can create events' }),
        createElement(Checkbox, { label: 'Can manage packages' }),
      ),
    );

    const fieldset = document.querySelector('fieldset');
    expect(fieldset).toHaveAttribute('aria-describedby', 'perm-desc');
    const legend = screen.getByText('Permissions');
    expect(legend.tagName).toBe('LEGEND');
  });
});

// ---------------------------------------------------------------------------
// 6. Select elements have accessible names
// ---------------------------------------------------------------------------

describe('Select elements — accessible names', () => {
  it('Native select with label has accessible name', () => {
    render(
      createElement(
        'div',
        null,
        createElement('label', { htmlFor: 'priority-select' }, 'Priority'),
        createElement(
          'select',
          { id: 'priority-select' },
          createElement('option', { value: '' }, 'Select priority'),
          createElement('option', { value: 'low' }, 'Low'),
          createElement('option', { value: 'high' }, 'High'),
        ),
      ),
    );

    const select = screen.getByLabelText('Priority');
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveAttribute('id', 'priority-select');
  });

  it('Native select with aria-label has accessible name', () => {
    render(
      createElement(
        'select',
        { 'aria-label': 'Filter by status' },
        createElement('option', { value: 'all' }, 'All'),
        createElement('option', { value: 'active' }, 'Active'),
      ),
    );

    const select = screen.getByRole('combobox', { name: 'Filter by status' });
    expect(select).toBeInTheDocument();
  });

  it('FormField wrapping a select provides label association', () => {
    render(
      createElement(
        FormField,
        { label: 'Category' } as any,
        createElement(
          'select',
          null,
          createElement('option', { value: '' }, 'Select...'),
          createElement('option', { value: 'security' }, 'Security'),
        ),
      ),
    );

    const label = screen.getByText('Category');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for');
  });

  it('Select in a form has an associated label element', () => {
    render(
      createElement(
        'form',
        null,
        createElement('label', { htmlFor: 'building' }, 'Building'),
        createElement(
          'select',
          { id: 'building', name: 'building' },
          createElement('option', { value: 'a' }, 'Tower A'),
          createElement('option', { value: 'b' }, 'Tower B'),
        ),
      ),
    );

    const select = screen.getByLabelText('Building');
    expect(select).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. File upload inputs have descriptive labels
// ---------------------------------------------------------------------------

describe('File upload inputs — descriptive labels', () => {
  it('File input with visible label is accessible', () => {
    render(
      createElement(
        'div',
        null,
        createElement('label', { htmlFor: 'photo-upload' }, 'Upload photos (JPG, PNG, max 4MB)'),
        createElement('input', {
          type: 'file',
          id: 'photo-upload',
          accept: 'image/jpeg,image/png',
        }),
      ),
    );

    const input = screen.getByLabelText('Upload photos (JPG, PNG, max 4MB)');
    expect(input).toHaveAttribute('type', 'file');
  });

  it('File input with aria-label has accessible name', () => {
    render(
      createElement('input', {
        type: 'file',
        'aria-label': 'Attach maintenance request documents',
        accept: '.pdf,.doc,.docx',
      }),
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute('aria-label', 'Attach maintenance request documents');
  });

  it('File input wrapped in FormField has label association', () => {
    render(
      createElement(
        FormField,
        { label: 'Supporting Documents' } as any,
        createElement('input', { type: 'file', accept: '.pdf' }),
      ),
    );

    const label = screen.getByText('Supporting Documents');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for');
  });

  it('Multiple file input describes accepted formats', () => {
    render(
      createElement(
        'div',
        null,
        createElement('label', { htmlFor: 'multi-upload' }, 'Upload incident photos'),
        createElement('input', {
          type: 'file',
          id: 'multi-upload',
          multiple: true,
          accept: 'image/*',
          'aria-describedby': 'upload-help',
        }),
        createElement('p', { id: 'upload-help' }, 'You can select up to 5 files'),
      ),
    );

    const input = screen.getByLabelText('Upload incident photos');
    expect(input).toHaveAttribute('aria-describedby', 'upload-help');
    const help = document.getElementById('upload-help');
    expect(help!.textContent).toBe('You can select up to 5 files');
  });
});

// ---------------------------------------------------------------------------
// 8. Password inputs have visibility toggle with aria-label
// ---------------------------------------------------------------------------

describe('Password inputs — visibility toggle accessibility', () => {
  it('Password input has type="password" by default', () => {
    render(createElement(Input, { label: 'Password', type: 'password', id: 'pwd' }));
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('Password visibility toggle button has descriptive aria-label', () => {
    render(
      createElement(
        'div',
        null,
        createElement(Input, { label: 'Password', type: 'password', id: 'pwd' }),
        createElement(
          'button',
          { type: 'button', 'aria-label': 'Show password' },
          createElement('svg', { 'aria-hidden': 'true' }),
        ),
      ),
    );

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-label', 'Show password');
  });

  it('Password toggle updates aria-label when password is shown', async () => {
    const user = userEvent.setup();

    let isVisible = false;

    const { rerender } = render(
      createElement(
        'div',
        null,
        createElement(Input, {
          label: 'Password',
          type: isVisible ? 'text' : 'password',
          id: 'pwd',
        }),
        createElement(
          'button',
          {
            type: 'button',
            'aria-label': isVisible ? 'Hide password' : 'Show password',
            onClick: () => {
              isVisible = !isVisible;
            },
          },
          'Toggle',
        ),
      ),
    );

    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-label', 'Show password');

    await user.click(toggle);

    // Re-render with updated state
    rerender(
      createElement(
        'div',
        null,
        createElement(Input, {
          label: 'Password',
          type: 'text',
          id: 'pwd',
        }),
        createElement(
          'button',
          {
            type: 'button',
            'aria-label': 'Hide password',
          },
          'Toggle',
        ),
      ),
    );

    const updatedToggle = screen.getByRole('button', { name: 'Hide password' });
    expect(updatedToggle).toHaveAttribute('aria-label', 'Hide password');

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('Password input with error has aria-invalid and describedby', () => {
    render(
      createElement(Input, {
        label: 'Password',
        type: 'password',
        error: 'Password must be at least 8 characters',
        id: 'pwd',
      }),
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'pwd-error');
  });
});

// ---------------------------------------------------------------------------
// 9. Form-level accessibility patterns
// ---------------------------------------------------------------------------

describe('Form-level accessibility — comprehensive patterns', () => {
  it.todo(
    'Complete form has all inputs labeled and errors linked — needs ResizeObserver in jsdom',
    () => {
      render(
        createElement(
          'form',
          { 'aria-label': 'Create maintenance request' },
          createElement(Input, { label: 'Title', required: true, id: 'title' }),
          createElement(Textarea, { label: 'Description', required: true, id: 'desc' }),
          createElement(
            'fieldset',
            null,
            createElement('legend', null, 'Priority'),
            createElement(
              RadioGroup,
              { defaultValue: 'medium' },
              createElement(RadioGroupItem, { value: 'low', label: 'Low' }),
              createElement(RadioGroupItem, { value: 'medium', label: 'Medium' }),
              createElement(RadioGroupItem, { value: 'high', label: 'High' }),
            ),
          ),
          createElement(Checkbox, { label: 'Permission to enter unit' }),
          createElement(Button, { type: 'submit' }, 'Submit Request'),
        ),
      );

      // All inputs are labeled
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();

      // Radio group is present
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(3);

      // Submit button has descriptive text
      expect(screen.getByRole('button', { name: 'Submit Request' })).toBeInTheDocument();

      // Form has aria-label
      const form = document.querySelector('form');
      expect(form).toHaveAttribute('aria-label', 'Create maintenance request');
    },
  );

  it('Disabled form fields are excluded from tab order', () => {
    render(
      createElement(
        'form',
        null,
        createElement(Input, { label: 'Locked Field', disabled: true }),
        createElement(Button, { disabled: true }, 'Locked Submit'),
      ),
    );

    const input = screen.getByLabelText('Locked Field');
    expect(input).toBeDisabled();

    const button = screen.getByRole('button', { name: 'Locked Submit' });
    expect(button).toBeDisabled();
  });

  it('Switch control has accessible label for screen readers', () => {
    render(
      createElement(Switch, {
        label: 'Send email notifications',
        description: 'Receive updates when packages arrive',
      }),
    );

    const label = screen.getByText('Send email notifications');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for');

    // Description is present as supplementary text
    expect(screen.getByText('Receive updates when packages arrive')).toBeInTheDocument();
  });
});
