# Concierge — Component Catalog

> **Purpose**: Exhaustive specification for every UI component in the Concierge design system.
> Each component is defined with TypeScript props, variants, accessibility requirements,
> animation references, and usage guidelines. Developers implement directly from this document.
>
> **Tech Stack**: Next.js 15, Tailwind CSS 4.x, Radix UI (headless primitives), Framer Motion (Motion).
> **Design Tokens**: All tokens reference `DESIGN-SYSTEM-v2.md`. Color space: OKLCH with hex fallbacks.
> **Typography**: Inter (body) + Inter Display (headings). See `DESIGN-SYSTEM-v2.md` Section 2.
> **Target Viewport**: Desktop monitors (1920x1080) primary. See `RESPONSIVE-BREAKPOINTS.md`.

---

## Table of Contents

1. [Primitives](#1-primitives) — 12 components
2. [Data Display](#2-data-display) — 15 components
3. [Feedback](#3-feedback) — 10 components
4. [Navigation](#4-navigation) — 10 components
5. [Layout](#5-layout) — 9 components
6. [Forms](#6-forms) — 10 components
7. [Specialized](#7-specialized) — 10 components
8. [Composite](#8-composite) — 6 components
9. [Business Operations](#9-business-operations) — 10 components

**Total: 92 components**

---

## Global Conventions

### Shared Types

```tsx
// All components use these shared types where applicable.

type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Status = 'success' | 'warning' | 'error' | 'info' | 'pending';
type Orientation = 'horizontal' | 'vertical';

// Every interactive component accepts these props:
interface BaseInteractiveProps {
  disabled?: boolean;
  className?: string;
  id?: string;
  'data-testid'?: string;
}
```

### Animation Reference Convention

Throughout this document, animation specs reference the `ANIMATION-PLAYBOOK.md` by ID (e.g., "MI-03" for card hover lift). When a component says "See AP: Section X," consult that document for exact Framer Motion config.

### Accessibility Baseline

Every component in this catalog meets WCAG 2.2 AA. Requirements listed per-component are in addition to these universal rules:

- All interactive elements have a minimum 44x44px touch target.
- All text meets 4.5:1 contrast ratio (3:1 for large text).
- Focus rings use `--accent` at 3px offset with `--accent-subtle` fill.
- `prefers-reduced-motion: reduce` disables all spring/tween animations.
- All components support `dir="rtl"` layout mirroring.

---

## 1. Primitives

### 1.1 Button

The primary interactive element. Every action in Concierge flows through a Button.

```tsx
interface ButtonProps extends BaseInteractiveProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  asChild?: boolean; // Radix Slot pattern for link-as-button
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent) => void;
}
```

**Variants**

| Variant     | Background                | Text             | Border                | Use Case                                         |
| ----------- | ------------------------- | ---------------- | --------------------- | ------------------------------------------------ |
| `primary`   | `--accent` (#0071E3)      | White            | None                  | Primary CTA: "Save," "Create," "Submit"          |
| `secondary` | `--bg-primary`            | `--text-primary` | 1px `--border-subtle` | Secondary action: "Cancel," "Back," "Export"     |
| `ghost`     | Transparent               | `--accent`       | None                  | Tertiary action: "Learn more," inline actions    |
| `danger`    | `--color-error` (#DC2626) | White            | None                  | Destructive action: "Delete," "Remove," "Revoke" |

**Sizes**

| Size | Height | Padding (H) | Font       | Icon Size |
| ---- | ------ | ----------- | ---------- | --------- |
| `sm` | 32px   | 12px        | 13px / 500 | 16px      |
| `md` | 40px   | 16px        | 14px / 500 | 18px      |
| `lg` | 48px   | 24px        | 15px / 600 | 20px      |

**States**

| State          | Primary                                                               | Secondary                       | Ghost                             | Danger                    |
| -------------- | --------------------------------------------------------------------- | ------------------------------- | --------------------------------- | ------------------------- |
| Default        | `--accent` bg                                                         | White bg, border                | Transparent                       | `--color-error` bg        |
| Hover          | `--accent-hover` bg                                                   | `--bg-secondary` bg             | `--accent-subtle` bg              | Error-600 bg              |
| Active/Pressed | `--accent-pressed` bg, scale(0.98)                                    | `--bg-tertiary` bg, scale(0.98) | `--accent-subtle` bg, scale(0.98) | Error-700 bg, scale(0.98) |
| Focus          | 3px `--accent-subtle` ring                                            | 3px `--accent-subtle` ring      | 3px `--accent-subtle` ring        | 3px error-subtle ring     |
| Disabled       | 50% opacity, no pointer events                                        | 50% opacity, no pointer events  | 50% opacity                       | 50% opacity               |
| Loading        | Spinner replaces leftIcon, text becomes `loadingText` or "Loading..." | Same                            | Same                              | Same                      |

**Animation**: See AP: Section 9.1 — springSnappy on press (scale 0.98 to 1.0). Loading spinner rotates at 0.8s per revolution.

**Accessibility**

- `role="button"` (native with `<button>`)
- `aria-disabled="true"` when disabled (not just the `disabled` attribute, for screen reader clarity)
- `aria-busy="true"` when loading
- Keyboard: `Enter` and `Space` trigger click. `Tab` to focus.
- Loading state announces "Loading, please wait" to screen readers via `aria-live="polite"`.

**Usage Guidelines**

- DO: One primary button per visible screen area. Multiple secondary/ghost buttons are acceptable.
- DO: Use `leftIcon` for action clarity (e.g., Plus icon on "Create Package").
- DO: Use `loading` state during async operations rather than disabling the button.
- DON'T: Use `danger` variant for non-destructive actions.
- DON'T: Nest interactive elements inside a Button.
- DON'T: Use Button for navigation; use a link styled via `asChild` with Next.js `Link`.

---

### 1.2 Input

Single-line text entry. The most-used form primitive in the platform.

```tsx
interface InputProps extends BaseInteractiveProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  size?: 'sm' | 'md' | 'lg';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightElement?: React.ReactNode; // For action buttons inside input
  error?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  autoComplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
}
```

**Sizes**

| Size | Height | Padding | Font       | Icon Size |
| ---- | ------ | ------- | ---------- | --------- |
| `sm` | 36px   | 0 10px  | 13px / 400 | 16px      |
| `md` | 44px   | 0 12px  | 15px / 400 | 20px      |
| `lg` | 52px   | 0 16px  | 16px / 400 | 20px      |

**States**: Default, Hover, Focus, Filled, Error, Disabled, Read-Only. See `DESIGN-SYSTEM-v2.md` Section 8.2 for exact CSS.

**Animation**: Border color transitions at 200ms ease. Error state triggers shake animation (AP: MI-05).

**Accessibility**

- Must always have an associated `<label>` via `FormField` wrapper or `aria-label`.
- `aria-invalid="true"` when `error` is true.
- `aria-describedby` links to help text and error message IDs.
- Password inputs include a show/hide toggle button with `aria-label="Show password"`.

**Usage Guidelines**

- DO: Always pair with `FormField` for label, help text, and error messaging.
- DO: Use `placeholder` for format hints ("e.g., Unit 1205"), not as label replacement.
- DON'T: Use for multi-line input; use Textarea instead.
- DON'T: Use `type="number"` for unit numbers or tracking IDs; use `type="text"` with `inputMode="numeric"`.

---

### 1.3 Textarea

Multi-line text entry for descriptions, notes, and comments.

```tsx
interface TextareaProps extends BaseInteractiveProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number; // Default: 3
  maxLength?: number;
  autoResize?: boolean; // Grows with content up to maxHeight
  maxHeight?: number; // Default: 200px
  error?: boolean;
  readOnly?: boolean;
  showCharCount?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}
```

**Dimensions**: Min height 88px (3 rows). Padding 12px all sides. Border radius 10px. Resize: vertical only (unless `autoResize`).

**Character Count**: Displayed bottom-right when `showCharCount` and `maxLength` are set. Colors: tertiary (0-89%), warning (90-99%), error (100%).

**Accessibility**

- `aria-invalid="true"` on error.
- Character count announced via `aria-live="polite"` region when crossing 90% threshold.

---

### 1.4 Select

Dropdown selector built on Radix UI `Select` primitive.

```tsx
interface SelectProps extends BaseInteractiveProps {
  size?: 'sm' | 'md' | 'lg';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  options: SelectOption[];
  error?: boolean;
  onChange?: (value: string) => void;
}

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string; // Groups options under headers
}
```

**Dimensions**: Same height as Input per size. Chevron icon (16px) at right 12px. Option list max-height: 280px (scrollable).

**Animation**: Option list enters via springGentle (AP: Section 8). Fade in over 150ms.

**Accessibility**

- Built on Radix `Select` — provides full ARIA listbox pattern.
- `ArrowUp`/`ArrowDown` navigate options. `Enter` selects. `Escape` closes.
- Type-ahead: typing characters jumps to matching option.
- `aria-invalid="true"` when `error` is true.

**Usage Guidelines**

- DO: Use for 4-20 options. Below 4, consider RadioGroup. Above 20, use Combobox.
- DO: Group related options with headers using the `group` property.
- DON'T: Use for boolean choices; use Toggle or Checkbox instead.

---

### 1.5 Checkbox

Binary selection, often used in lists and bulk operations.

```tsx
interface CheckboxProps extends BaseInteractiveProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean; // "Select all" with partial selection
  label?: string;
  description?: string; // Secondary text below label
  error?: boolean;
  onChange?: (checked: boolean) => void;
}
```

**Dimensions**: 20x20px box, 4px border-radius. Check icon 12px. Touch target extends to full label row (min 44px height).

**States**

| State         | Appearance                                                                   |
| ------------- | ---------------------------------------------------------------------------- |
| Unchecked     | 1px `--border-subtle` border, white fill                                     |
| Checked       | `--accent` fill, white check icon                                            |
| Indeterminate | `--accent` fill, white minus icon                                            |
| Hover         | Border darkens to neutral-500 (unchecked) or `--accent-hover` fill (checked) |
| Focus         | 3px `--accent-subtle` ring around box                                        |
| Disabled      | 50% opacity                                                                  |
| Error         | `--color-error` border                                                       |

**Animation**: Check icon draws in (stroke-dasharray animation) over 200ms. See AP: Section 9.4.

**Accessibility**

- Built on Radix `Checkbox`.
- `aria-checked="mixed"` for indeterminate state.
- `Space` toggles. `Tab` to focus.
- Label and description connected via `aria-describedby`.

---

### 1.6 Radio

Single selection from a group of options.

```tsx
interface RadioGroupProps extends BaseInteractiveProps {
  value?: string;
  defaultValue?: string;
  options: RadioOption[];
  orientation?: Orientation; // Default: "vertical"
  error?: boolean;
  onChange?: (value: string) => void;
}

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
```

**Dimensions**: 20x20px circle. Inner dot 8px when selected. Label row min height 44px.

**States**: Mirrors Checkbox states with circular rendering. Selected state: `--accent` ring + filled inner dot.

**Animation**: Inner dot scales from 0 to 1 via springSnappy (AP: Section 9).

**Accessibility**

- Built on Radix `RadioGroup`.
- `ArrowUp`/`ArrowDown` cycle through options (vertical). `ArrowLeft`/`ArrowRight` for horizontal.
- `Tab` moves focus to the group; arrows navigate within.

---

### 1.7 Toggle

Boolean on/off switch for settings and preferences.

```tsx
interface ToggleProps extends BaseInteractiveProps {
  checked?: boolean;
  defaultChecked?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
  onChange?: (checked: boolean) => void;
}
```

**Dimensions**

| Size | Track (W x H) | Knob        | Border Radius |
| ---- | ------------- | ----------- | ------------- |
| `sm` | 36 x 20px     | 16px circle | 10px (pill)   |
| `md` | 48 x 28px     | 24px circle | 14px (pill)   |

**States**

| State       | Track            | Knob                 |
| ----------- | ---------------- | -------------------- |
| Off         | `--bg-tertiary`  | White, left-aligned  |
| On          | `--accent`       | White, right-aligned |
| Hover (off) | Neutral-300      | —                    |
| Hover (on)  | `--accent-hover` | —                    |
| Disabled    | 50% opacity      | —                    |

**Animation**: Knob slides via springSnappy. Track color cross-fades over 150ms.

**Accessibility**

- Built on Radix `Switch`.
- `role="switch"`, `aria-checked`.
- `Space` toggles. `Enter` toggles.
- Label must be present (visible or via `aria-label`).

---

### 1.8 DatePicker

Calendar-based date selection.

```tsx
interface DatePickerProps extends BaseInteractiveProps {
  value?: Date | null;
  defaultValue?: Date;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((date: Date) => boolean);
  format?: string; // Default: "MMM d, yyyy"
  error?: boolean;
  clearable?: boolean;
  onChange?: (date: Date | null) => void;
}
```

**Trigger**: Input-style field (44px height) with calendar icon (20px) at right. Clicking opens a popover calendar.

**Calendar Popover**: 280px wide. Shows one month. Header: left/right arrows to navigate months, month/year clickable to switch to month/year picker. Day cells: 40x40px grid cells. Today: accent ring. Selected: accent fill + white text. Range (if applicable): accent-subtle fill between start and end.

**Animation**: Popover enters via springGentle. Month transitions slide left/right over 200ms.

**Accessibility**

- Full keyboard navigation: Arrow keys move between days. Page Up/Down for months. Home/End for start/end of week.
- `aria-label` on each day cell: "Monday, March 16, 2026".
- Disabled dates announced as "unavailable".
- `Escape` closes popover, returns focus to trigger.

**Usage Guidelines**

- DO: Use for single date selection. For date ranges, compose two DatePickers or build a DateRangePicker.
- DO: Set `minDate` and `maxDate` to prevent impossible selections (e.g., move-in date cannot be before building construction).
- DON'T: Use for time selection; pair with TimePicker.

---

### 1.9 TimePicker

Time selection with hour/minute granularity.

```tsx
interface TimePickerProps extends BaseInteractiveProps {
  value?: string; // "HH:mm" format (24h internal)
  defaultValue?: string;
  placeholder?: string;
  format?: '12h' | '24h'; // Display format. Default: "12h"
  minuteStep?: number; // Default: 15 (options: 1, 5, 15, 30)
  minTime?: string;
  maxTime?: string;
  error?: boolean;
  onChange?: (time: string) => void;
}
```

**Trigger**: Input-style field with clock icon at right. Opens a dropdown with scrollable hour and minute columns.

**Dropdown**: Two columns (hour, minute) plus AM/PM toggle for 12h format. Each column scrolls independently. Selected item: accent background.

**Accessibility**

- Arrow keys navigate within columns. Tab moves between columns.
- `aria-label` on each option: "2:30 PM".
- `Escape` closes, returns focus to trigger.

---

### 1.10 ColorPicker

Color selection for event type configuration (admin only).

```tsx
interface ColorPickerProps extends BaseInteractiveProps {
  value?: string; // OKLCH string or hex
  defaultValue?: string;
  presets?: string[]; // Preset color swatches
  allowCustom?: boolean; // Show hex/oklch input. Default: false
  onChange?: (color: string) => void;
}
```

**Trigger**: 28x28px color swatch with 1px border. Clicking opens a popover.

**Popover**: Grid of preset swatches (8 event type colors from the design system). If `allowCustom`, an additional hex input field appears below the grid.

**Accessibility**

- Grid of swatches navigable with arrow keys.
- Each swatch has `aria-label`: "Blue, selected" or "Red".
- Custom hex input validates on blur.

---

### 1.11 Slider

Numeric value selection within a range.

```tsx
interface SliderProps extends BaseInteractiveProps {
  value?: number;
  defaultValue?: number;
  min: number;
  max: number;
  step?: number; // Default: 1
  showValue?: boolean; // Displays current value above thumb
  showMinMax?: boolean; // Labels at track ends
  formatValue?: (value: number) => string;
  onChange?: (value: number) => void;
}
```

**Dimensions**: Track height 4px, thumb 20x20px circle. Track filled portion uses `--accent`. Unfilled portion uses `--bg-tertiary`.

**Animation**: Value tooltip appears on focus/hover via easeFadeIn (200ms).

**Accessibility**

- Built on Radix `Slider`.
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (formatted).
- Arrow keys adjust by step. Page Up/Down adjust by 10x step.

---

### 1.12 FileUpload

File selection and drag-and-drop upload.

```tsx
interface FileUploadProps extends BaseInteractiveProps {
  accept?: string; // MIME types: "image/*,.pdf,.doc,.docx"
  maxSize?: number; // Bytes. Default: 4MB (4_194_304)
  maxFiles?: number; // Default: 1
  multiple?: boolean;
  value?: File[];
  onUpload?: (files: File[]) => void;
  onRemove?: (file: File) => void;
  children?: React.ReactNode; // Custom dropzone content
}
```

**Dropzone**: 80px height, dashed 1px `--border-subtle` border, 10px border-radius. Centered: upload icon (24px) + "Drag files here or click to browse" + accepted formats caption.

**States**

| State     | Appearance                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| Default   | Dashed border, neutral icon                                                   |
| Hover     | `--bg-secondary` background, border darkens                                   |
| Drag Over | `--accent-subtle` background, `--accent` dashed border, "Drop to upload" text |
| Uploading | Progress bar replaces dropzone content                                        |
| Error     | Error border, error message below                                             |

**File Preview**: Below dropzone, each file renders as a row: file icon + name + size + remove button (X icon).

**Accessibility**

- Dropzone is keyboard-focusable. `Enter`/`Space` opens native file picker.
- `aria-label="Upload files"`.
- Progress announced via `aria-live="polite"`.
- Error messages announced immediately.

**Usage Guidelines**

- DO: Show accepted file types and max size prominently.
- DO: Validate file type and size on client before uploading.
- DON'T: Auto-upload on drop without user confirmation in sensitive contexts.
- DON'T: Allow files larger than 4MB per the platform specification.

---

## 2. Data Display

### 2.1 DataTable

The most-used compound component. Every list page uses this pattern. See `DESIGN-SYSTEM-v2.md` Section 5.2 for full composition tree.

```tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyState?: EmptyStateConfig;
  selectable?: boolean; // Enables row checkboxes
  sortable?: boolean;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  pagination?: PaginationConfig;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  stickyHeader?: boolean;
  className?: string;
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  hiddenBelow?: 'sm' | 'md' | 'lg' | 'xl'; // Responsive column hiding
}

interface PaginationConfig {
  pageSize: number;
  pageSizeOptions?: number[]; // e.g., [25, 50, 100]
  totalCount: number;
}

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

**Dimensions**

| Element           | Specification                                                   |
| ----------------- | --------------------------------------------------------------- |
| Header row height | 44px                                                            |
| Body row height   | 56px                                                            |
| Header font       | 13px / 600, `--text-secondary`, uppercase, 0.5px letter-spacing |
| Body font         | 15px / 400, `--text-primary`                                    |
| Cell padding      | 16px horizontal                                                 |
| Row hover         | `--bg-secondary` background, 150ms transition                   |
| Selected row      | `--accent-subtle` background                                    |
| Sort indicator    | ChevronUp/Down icon (14px) next to header text                  |

**Loading State**: Skeleton rows (8 rows of pulsing rectangles matching column widths). See AP: Section 11.

**Animation**: Rows enter via staggered fade + translateY (AP: Section 6). Sort transitions use layout animation. Row selection checkbox scales via springSnappy.

**Accessibility**

- Uses `role="table"`, `role="rowgroup"`, `role="row"`, `role="columnheader"`, `role="cell"`.
- Sortable columns: `aria-sort="ascending"` or `"descending"` or `"none"`.
- Selectable rows: checkbox with `aria-label="Select row for [primary identifier]"`.
- "Select all" checkbox in header with `aria-label="Select all rows"`, supports indeterminate.
- Keyboard: `Tab` moves between interactive elements within cells. Arrow keys are NOT used for cell navigation (this is not a spreadsheet).
- Row count announced: "Showing 1 to 25 of 1,987 results".

**Usage Guidelines**

- DO: Always provide an `emptyState` with a clear CTA.
- DO: Hide non-essential columns on smaller breakpoints using `hiddenBelow`.
- DO: Default sort to the most useful column (usually date, descending).
- DON'T: Display more than 8 columns on the default view. Use column visibility toggles for additional data.
- DON'T: Use DataTable for fewer than 5 items; use a simple list or CardGrid.

---

### 2.2 Card

Generic content container. Foundation for all card-based layouts.

```tsx
interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  clickable?: boolean;
  selected?: boolean;
  accentColor?: string; // Left 3px border color (event type coding)
  padding?: 'none' | 'compact' | 'default' | 'spacious';
  className?: string;
  onClick?: () => void;
}
```

**Variants**

| Variant    | Shadow                                    | Border                | Use Case                                |
| ---------- | ----------------------------------------- | --------------------- | --------------------------------------- |
| `elevated` | `--shadow-1` (rest), `--shadow-2` (hover) | None                  | Clickable cards, KPI cards              |
| `outlined` | None                                      | 1px `--border-subtle` | Static information cards, form sections |
| `flat`     | None                                      | None                  | Cards within cards, inner composition   |

**Padding**

| Padding    | Value |
| ---------- | ----- |
| `none`     | 0     |
| `compact`  | 16px  |
| `default`  | 20px  |
| `spacious` | 24px  |

**Animation**: Clickable cards lift on hover (AP: MI-03). `translateY(-2px)` + shadow transition to level 2. Press: `scale(0.99)` via springSnappy.

**Accessibility**

- If `clickable`, rendered as a `<button>` or wrapped in a focusable container.
- `role="article"` for content cards. No role for purely structural containers.
- Focus ring on clickable cards.

---

### 2.3 StatCard

KPI metric display with optional trend and sparkline.

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  formatValue?: (value: number) => string;
  trend?: {
    value: number; // Percentage: +12 or -5
    direction: 'up' | 'down';
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  sparklineData?: number[]; // Array of values for mini chart
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}
```

**Layout**: See `DESIGN-SYSTEM-v2.md` Section 5.2 (StatCardRow Composition).

| Element   | Typography                                     | Color                                                                      |
| --------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Label     | Overline (11px, 600, uppercase, 0.8px spacing) | `--text-secondary`                                                         |
| Value     | 28px / 700 (Title 1)                           | `--text-primary`                                                           |
| Trend     | Caption (12px, 500)                            | Success-700 (positive), Error-700 (negative), `--text-secondary` (neutral) |
| Sparkline | 48px height, 100% width                        | `--accent` (neutral), success-500 (positive), error-500 (negative)         |

**Animation**: Value counts up from 0 on first render (AP: Section 10 — status counter). Trend arrow bounces via springBouncy. Sparkline draws left-to-right over 600ms.

**Accessibility**

- `role="group"` with `aria-label` combining label and value: "Open requests: 47, up 12% from last period".
- Trend direction communicated in screen reader text, not just by color/arrow.
- If clickable, provides `role="button"`.

---

### 2.4 Badge

Inline label for categorization and metadata.

```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}
```

**Sizes**

| Size | Height | Padding  | Font       | Border Radius |
| ---- | ------ | -------- | ---------- | ------------- |
| `sm` | 20px   | 4px 8px  | 11px / 500 | 999px (pill)  |
| `md` | 24px   | 4px 10px | 12px / 500 | 999px (pill)  |

**Color Mapping**: Each `color` maps to the badge token pairs from `DESIGN-SYSTEM-v2.md` Section 1.3-1.8. Example: `green` uses `--badge-success-bg` background + `--badge-success-text` text.

**Accessibility**

- Purely decorative badges need no ARIA.
- Removable badges: remove button has `aria-label="Remove [badge text]"`.

---

### 2.5 StatusBadge

Semantic status indicator with enforced color-meaning mapping.

```tsx
interface StatusBadgeProps {
  status: Status;
  label: string;
  showDot?: boolean; // Colored dot before label. Default: true
  size?: 'sm' | 'md';
}
```

**Status-Color Mapping**

| Status    | Dot Color          | Background           | Text                   |
| --------- | ------------------ | -------------------- | ---------------------- |
| `success` | `--status-success` | `--badge-success-bg` | `--badge-success-text` |
| `warning` | `--status-warning` | `--badge-warning-bg` | `--badge-warning-text` |
| `error`   | `--status-error`   | `--badge-error-bg`   | `--badge-error-text`   |
| `info`    | `--status-info`    | `--badge-info-bg`    | `--badge-info-text`    |
| `pending` | Neutral-400        | `--badge-pending-bg` | `--badge-pending-text` |

**Dot**: 6px circle, `margin-right: 6px`. Pulsing animation on `error` status (AP: Section 10.2).

**Accessibility**

- `role="status"` on the badge.
- Screen reader text includes status: "Status: Delivered" not just "Delivered".

---

### 2.6 Avatar

User or entity profile image with fallback.

```tsx
interface AvatarProps {
  src?: string;
  alt: string;
  name: string; // Used for initials fallback
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  shape?: 'circle' | 'rounded'; // Default: "circle"
}
```

**Sizes**

| Size | Dimension | Font (initials) | Status dot |
| ---- | --------- | --------------- | ---------- |
| `xs` | 24px      | 10px / 600      | 6px        |
| `sm` | 32px      | 12px / 600      | 8px        |
| `md` | 40px      | 14px / 600      | 10px       |
| `lg` | 56px      | 18px / 600      | 12px       |
| `xl` | 80px      | 24px / 600      | 14px       |

**Fallback Order**: Image `src` -> Initials (first letter of first + last name) on colored background -> Generic user icon.

**Initials Background**: Deterministic color from name hash, using the event type accent palette. Same name always produces the same color.

**Accessibility**

- `role="img"` with `aria-label` set to `alt` or `name`.
- Status dot has `aria-label`: "Online", "Offline", etc.

---

### 2.7 AvatarGroup

Stacked display of multiple avatars with overflow indicator.

```tsx
interface AvatarGroupProps {
  avatars: AvatarProps[];
  max?: number; // Default: 4. Shows "+N more" for overflow.
  size?: 'xs' | 'sm' | 'md' | 'lg';
  spacing?: number; // Overlap in px. Default: -8
}
```

**Rendering**: Avatars overlap right-to-left. Overflow counter: circular badge with "+N" text. Each avatar has a 2px white border for separation.

**Accessibility**

- Container: `role="group"`, `aria-label="N users"`.
- Overflow counter: `aria-label="and N more users"`.

---

### 2.8 Tooltip

Contextual information on hover/focus.

```tsx
interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left'; // Default: "top"
  align?: 'start' | 'center' | 'end';
  delayDuration?: number; // ms before showing. Default: 300
  children: React.ReactNode; // Trigger element
}
```

**Dimensions**: Max-width 280px. Padding 8px 12px. Border-radius 8px. Background `--text-primary` (#1D1D1F). Text white, 13px / 400. Arrow: 6px.

**Animation**: Fade in over 150ms (easeFadeIn). Slight translateY based on side.

**Accessibility**

- Built on Radix `Tooltip`.
- `role="tooltip"`, linked via `aria-describedby`.
- Shows on focus for keyboard users (no delay on focus).
- Tooltip content must be text-only for screen readers. No interactive elements inside tooltips.

**Usage Guidelines**

- DO: Use for supplementary information that helps but is not essential.
- DO: Use on icon-only buttons to explain the action.
- DON'T: Put essential information in tooltips — it must be accessible without hovering.
- DON'T: Use on touch-only devices (tooltip is not shown; ensure info is available elsewhere).

---

### 2.9 Popover

Rich interactive content container triggered by click.

```tsx
interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean; // Traps focus when true. Default: false
}
```

**Dimensions**: Min-width 200px, max-width 400px. Padding 16px. Border-radius 12px. Shadow `--shadow-3`. Background `--bg-primary`. Border 1px `--border-subtle`.

**Animation**: Enters via springGentle + easeFadeIn. Exits via easeFadeOut (150ms). See AP: Section 8.

**Accessibility**

- Built on Radix `Popover`.
- Focus trapped when `modal` is true.
- `Escape` closes. Focus returns to trigger.
- Content is linked via `aria-describedby` or contains interactive elements.

---

### 2.10 KPICard

Enhanced StatCard for dashboard hero metrics.

```tsx
interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string; // "packages", "%", "hrs"
  comparison?: {
    label: string; // "vs last week"
    value: number;
    direction: 'up' | 'down' | 'flat';
    sentiment: 'positive' | 'negative' | 'neutral';
  };
  chart?: {
    type: 'sparkline' | 'donut' | 'progress';
    data: number[];
    color?: string;
  };
  action?: { label: string; onClick: () => void };
  loading?: boolean;
}
```

**Layout**: 240px min-width, auto height. Internal grid: value block (left), chart block (right, 64x64px). Below: comparison line + optional action link.

**Animation**: Value animates from 0 via spring counter (AP: Section 10). Chart draws on mount.

---

### 2.11 Sparkline

Minimal inline chart for trend visualization.

```tsx
interface SparklineProps {
  data: number[];
  width?: number; // Default: 100 (100%)
  height?: number; // Default: 48
  color?: string; // Default: "--accent"
  fillOpacity?: number; // Area fill. Default: 0.1
  showLastPoint?: boolean; // Dot at last value. Default: true
  animate?: boolean; // Draw animation. Default: true
}
```

**Rendering**: SVG path with `stroke-linecap: round`, 2px stroke. Fill area below the line with gradient opacity.

**Animation**: Path draws left-to-right over 600ms via `stroke-dashoffset`. Last point fades in at end.

**Accessibility**

- `role="img"`, `aria-label` describing the trend: "Trending up from 12 to 47 over 7 days".
- Hidden from screen readers if purely decorative (within a StatCard that already has labels).

---

### 2.12 Chart

Wrapper component for data visualization using a charting library (Recharts or similar).

```tsx
interface ChartProps {
  type: 'line' | 'bar' | 'horizontalBar' | 'donut' | 'area' | 'stackedBar' | 'groupedBar';
  data: ChartDataPoint[];
  series: ChartSeries[];
  height?: number; // Default: 300
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  colorScheme?: 'default' | 'colorblind'; // Default uses chart palette, colorblind uses Section 1.11
  xAxisLabel?: string;
  yAxisLabel?: string;
  formatXAxis?: (value: string) => string;
  formatYAxis?: (value: number) => string;
}

interface ChartDataPoint {
  label: string;
  [seriesKey: string]: string | number;
}

interface ChartSeries {
  key: string;
  name: string;
  color?: string; // Override auto-assigned color
}
```

**Color Assignment**: Series colors assigned in order from the chart palette (`--chart-1` through `--chart-6`). Never more than 6 series.

**Accessibility**

- All charts include a visually hidden data table equivalent.
- Legends are keyboard-navigable; clicking a legend item toggles series visibility.
- Tooltips appear on keyboard focus of data points.
- Pattern fills added for 3+ series (for colorblind and print). See `DESIGN-SYSTEM-v2.md` Section 1.11.

**Usage Guidelines**

- DO: Follow the Chart Type Selection Matrix in `DESIGN-SYSTEM-v2.md` Section 6.1.
- DO: Always include axis labels and a legend.
- DON'T: Use more than 6 series. Group extras into "Other".
- DON'T: Use pie charts. Use donut charts instead (center space for total/label).

---

### 2.13 Timeline

Chronological event display for activity logs and history.

```tsx
interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical'; // Always vertical in v1
  showConnector?: boolean; // Default: true
}

interface TimelineItem {
  id: string;
  timestamp: Date;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: string; // Dot color. Maps to status or event type colors.
  actor?: { name: string; avatar?: string };
  content?: React.ReactNode; // Rich content below description
}
```

**Layout**: Left-aligned vertical timeline. Dot: 10px circle at left, connected by 2px `--border-subtle` vertical line. Content block to the right of the dot with 16px left margin.

**Animation**: Items enter via staggered fade-up (AP: Section 13 orchestration, 30ms stagger).

**Accessibility**

- `role="list"` on container, `role="listitem"` on each item.
- Timestamps use `<time datetime="">` element.
- Screen reader reads items in chronological order.

---

### 2.14 ProgressBar

Linear progress indicator.

```tsx
interface ProgressBarProps {
  value: number; // 0-100
  max?: number; // Default: 100
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'success' | 'warning' | 'error';
  showLabel?: boolean; // Percentage text. Default: false
  label?: string; // Custom label overriding percentage
  animate?: boolean; // Animate fill on mount. Default: true
}
```

**Sizes**

| Size | Height |
| ---- | ------ |
| `sm` | 4px    |
| `md` | 8px    |
| `lg` | 12px   |

Track: `--bg-tertiary`. Fill: determined by `color` prop (default `--accent`). Border-radius: 999px (pill).

**Animation**: Fill width animates via springResponsive on mount and value changes.

**Accessibility**

- `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- `aria-label` combines custom label or "Progress: N%".

---

### 2.15 Tag

Removable label for categorization. Used in filters and multi-select displays.

```tsx
interface TagProps {
  children: React.ReactNode;
  color?: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  leftIcon?: React.ReactNode;
  size?: 'sm' | 'md';
}
```

**Dimensions**: Same as Badge but with a remove button (X icon, 14px) appended when `removable`. Remove button has its own hover state (background darkens).

**Accessibility**

- `role="listitem"` when inside a TagInput or filter group.
- Remove button: `aria-label="Remove [tag text]"`.
- Keyboard: `Backspace` on focused tag removes it. Arrow keys navigate between tags.

---

## 3. Feedback

### 3.1 Toast

Non-blocking notification for action confirmations and system messages.

```tsx
interface ToastProps {
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  action?: { label: string; onClick: () => void };
  duration?: number; // ms. Default: 5000. Use Infinity for persistent.
  dismissible?: boolean; // Default: true
}

// Provider API
interface ToastProviderProps {
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  maxToasts?: number; // Default: 3. Older ones dismissed.
}
```

**Dimensions**: Width 360px (fixed on desktop), max-width calc(100vw - 32px) on mobile. Padding 16px. Border-radius 12px. Shadow `--shadow-5`. Left accent border: 3px, colored by variant.

**Layout**: Icon (20px, variant color) | Title (14px, 600) + Description (13px, 400) | Action button (ghost) | Close button (X, 16px).

**Animation**: Slides in from right via springGentle (AP: Section 4). Auto-dismisses by sliding out + fading. Stack: each toast pushes previous ones up. See AP: Section 4 for full specification.

**Accessibility**

- `role="alert"` for error/warning. `role="status"` for success/info.
- `aria-live="assertive"` for errors. `aria-live="polite"` for others.
- Action button is focusable. Close button has `aria-label="Dismiss notification"`.
- Toast remains visible while hovered or focused (timer pauses).
- `prefers-reduced-motion`: no slide, instant appear/disappear.

**Usage Guidelines**

- DO: Use for confirmations of completed actions ("Package released successfully").
- DO: Include an undo action for reversible operations.
- DON'T: Use for critical errors that require user action — use Alert or Dialog instead.
- DON'T: Stack more than 3 toasts. If many events happen simultaneously, batch them: "5 packages released."

---

### 3.2 Alert

Inline persistent message for important information.

```tsx
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode; // Description content
  action?: { label: string; onClick: () => void };
  dismissible?: boolean; // Default: false
  onDismiss?: () => void;
  icon?: React.ReactNode; // Overrides default variant icon
}
```

**Dimensions**: Full-width of parent. Padding 16px. Border-radius 10px. Border: 1px variant-100 color. Background: variant-50 color.

| Variant   | Icon          | Background | Border      | Text                              |
| --------- | ------------- | ---------- | ----------- | --------------------------------- |
| `info`    | InfoCircle    | Info-50    | Info-100    | Info-800 (title), Info-700 (body) |
| `success` | CheckCircle   | Success-50 | Success-100 | Success-800, Success-700          |
| `warning` | AlertTriangle | Warning-50 | Warning-100 | Warning-800, Warning-700          |
| `error`   | AlertCircle   | Error-50   | Error-100   | Error-800, Error-700              |

**Accessibility**

- `role="alert"` for error/warning. `role="status"` for info/success.
- Dismiss button: `aria-label="Dismiss alert"`.

---

### 3.3 Dialog / Modal

Focused overlay for creating, editing, or confirming actions.

```tsx
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  children: React.ReactNode; // Body content
  footer?: React.ReactNode; // Action buttons
  closable?: boolean; // Show X button. Default: true
  preventClose?: boolean; // Prevent closing on backdrop click. Default: false
}
```

**Sizes**

| Size         | Width         | Use Case                                           |
| ------------ | ------------- | -------------------------------------------------- |
| `sm`         | 400px         | Confirmations, simple forms                        |
| `md`         | 560px         | Standard forms (package check-in, service request) |
| `lg`         | 720px         | Complex forms, multi-step wizards                  |
| `xl`         | 960px         | Detail views, side-by-side layouts                 |
| `fullscreen` | 100vw x 100vh | Mobile sheets, document preview                    |

**Dimensions**: Max-height `calc(100vh - 64px)`. Scrollable body. Sticky header (title + close) and sticky footer (actions). Border-radius 16px. Shadow `--shadow-4`. Backdrop: `rgba(0, 0, 0, 0.4)`.

**Animation**: Backdrop fades in 200ms. Dialog enters via springGentle (scale 0.95 to 1.0, opacity 0 to 1). See AP: Section 8.

**Accessibility**

- Built on Radix `Dialog`.
- Focus trapped within modal. Initial focus on first interactive element (or close button).
- `Escape` closes (unless `preventClose`).
- `aria-labelledby` linked to title. `aria-describedby` linked to description.
- Background content receives `aria-hidden="true"` and `inert`.

**Usage Guidelines**

- DO: Use sticky footer for primary/secondary action buttons.
- DO: Use `preventClose` for forms with unsaved changes (show confirmation dialog on close attempt).
- DON'T: Open a modal from within a modal (max one dialog layer).
- DON'T: Put critical information in a modal that should be on its own page.

---

### 3.4 ConfirmDialog

Specialized Dialog for destructive action confirmation.

```tsx
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string; // Default: "Delete"
  cancelLabel?: string; // Default: "Cancel"
  variant?: 'danger' | 'warning'; // Default: "danger"
  confirmationText?: string; // If set, user must type this text to enable confirm button
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
}
```

**Layout**: `sm` Dialog (400px). Icon (AlertTriangle, 48px, centered, variant color). Title centered. Description centered. Two buttons: Cancel (secondary) + Confirm (danger or warning variant).

**Confirmation Text**: When set (e.g., "DELETE"), an input appears. The confirm button remains disabled until the typed text matches exactly.

**Accessibility**

- Initial focus on Cancel button (not Confirm) to prevent accidental confirmation.
- `aria-describedby` includes the full warning description.

---

### 3.5 Sheet / Drawer

Slide-over panel for secondary content without leaving the page context.

```tsx
interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'right' | 'left' | 'bottom'; // Default: "right"
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Sizes (right/left side)**

| Size | Width |
| ---- | ----- |
| `sm` | 320px |
| `md` | 480px |
| `lg` | 640px |

**Bottom sheet**: Height auto, max `80vh`. Used on mobile.

**Animation**: Slides in from the specified side via springGentle. Backdrop fades in 200ms.

**Accessibility**

- Focus trapped. `Escape` closes.
- `aria-labelledby` linked to title.
- Backdrop click closes (unless content has unsaved changes).

---

### 3.6 LoadingSkeleton

Placeholder content shown during data loading.

```tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number; // For "text" variant, renders multiple lines
  className?: string;
  animate?: boolean; // Default: true
}
```

**Appearance**: Background `--bg-tertiary` with a shimmer gradient sweep (left-to-right, `--bg-secondary` to `--bg-tertiary` to `--bg-secondary`).

**Animation**: Shimmer sweep: 1.5s duration, infinite loop, `linear-gradient` animated via `translateX`. Disabled with `prefers-reduced-motion` (solid `--bg-tertiary` instead).

**Pre-built Skeletons**

```tsx
// Convenience components matching common layouts
<Skeleton.Table rows={8} columns={5} />
<Skeleton.StatCards count={4} />
<Skeleton.Card />
<Skeleton.Form fields={6} />
```

**Accessibility**

- `aria-busy="true"` on the container being loaded.
- `aria-label="Loading content"`.
- Screen readers announce "Loading" once (not per skeleton element).

---

### 3.7 Spinner

Inline loading indicator for buttons and small areas.

```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'white' | 'current'; // "current" inherits parent text color
  label?: string; // Screen reader text. Default: "Loading"
}
```

**Sizes**

| Size | Dimension | Stroke Width |
| ---- | --------- | ------------ |
| `sm` | 16px      | 2px          |
| `md` | 24px      | 2.5px        |
| `lg` | 40px      | 3px          |

**Rendering**: SVG circle with `stroke-dasharray` creating a 270-degree arc. Rotates at 0.8s per revolution.

**Accessibility**

- `role="status"`, `aria-label` set to `label`.
- Wrapped in `aria-live="polite"` region.

---

### 3.8 EmptyState

Full-area placeholder when no data exists.

```tsx
interface EmptyStateProps {
  icon: React.ReactNode; // Line-art illustration or icon (120x120px)
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  secondaryAction?: { label: string; onClick: () => void }; // "Learn more" link
}
```

**Layout**: Centered vertically and horizontally within parent. Max-width 400px. Icon (120x120px) -> 16px gap -> Title (22px, 600) -> 8px gap -> Description (15px, 400, `--text-secondary`) -> 24px gap -> Primary CTA button (md) -> 12px gap -> Secondary link.

**Illustration Style**: Line-art only. 1.5px stroke. Primary color `--text-tertiary`. One accent-colored detail per illustration. Max 3 objects. See `SCREEN-STATES.md` Section 1.1.

**Accessibility**

- `role="status"`.
- Illustration is decorative (`aria-hidden="true"`). Title and description carry the meaning.
- CTA button is the first focusable element.

---

### 3.9 ErrorState

Full-area error display when data fails to load.

```tsx
interface ErrorStateProps {
  title?: string; // Default: "Something went wrong"
  description?: string; // Default: "We couldn't load this content. Please try again."
  error?: Error; // For dev-mode error details
  retryAction?: { label?: string; onClick: () => void }; // Default label: "Try again"
  secondaryAction?: { label: string; onClick: () => void }; // e.g., "Go to dashboard"
}
```

**Layout**: Same as EmptyState but with AlertCircle icon (64px, `--color-error`).

**Accessibility**

- `role="alert"` since this indicates a problem.
- Retry button receives initial focus.

---

### 3.10 ProgressIndicator

Multi-step progress display for wizards and workflows.

```tsx
interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number; // 0-indexed
  orientation?: Orientation; // Default: "horizontal"
  size?: 'sm' | 'md';
}

interface ProgressStep {
  label: string;
  description?: string;
  status?: 'complete' | 'current' | 'upcoming' | 'error';
}
```

**Layout (horizontal)**: Steps connected by horizontal lines. Each step: numbered circle (24px for sm, 32px for md) -> label below.

| Status   | Circle                             | Line (to next)           | Label                  |
| -------- | ---------------------------------- | ------------------------ | ---------------------- |
| Complete | `--accent` fill, white checkmark   | `--accent` solid         | `--text-primary`       |
| Current  | `--accent` ring, accent dot inside | `--border-subtle` dashed | `--accent`, 600 weight |
| Upcoming | `--border-subtle` ring             | `--border-subtle` dashed | `--text-secondary`     |
| Error    | `--color-error` ring, X icon       | `--color-error` dashed   | `--color-error`        |

**Animation**: Completion transitions: circle fills with accent via springSnappy, checkmark draws in (stroke animation). Line fills left-to-right over 300ms.

**Accessibility**

- `role="navigation"`, `aria-label="Progress"`.
- Each step: `aria-current="step"` for current. `aria-label="Step N: [label], [status]"`.
- Not interactive (purely informational). For interactive steps, use Tabs or StepIndicator from Navigation.

---

## 4. Navigation

### 4.1 Sidebar

Role-aware primary navigation. See `DESIGN-SYSTEM.md` Section 5 for full specification.

```tsx
interface SidebarProps {
  items: SidebarSection[];
  activeItemId: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  user: {
    name: string;
    role: string;
    building: string;
    avatar?: string;
  };
}

interface SidebarSection {
  label: string; // Category header: "OVERVIEW", "OPERATIONS", etc.
  items: SidebarItemConfig[];
}

interface SidebarItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number; // Notification count
  roles?: string[]; // Which roles can see this item
}
```

**Dimensions**

| State     | Width              | Content                                            |
| --------- | ------------------ | -------------------------------------------------- |
| Expanded  | 240px              | Icon + label + category headers                    |
| Collapsed | 64px               | Icon only, centered. Tooltip on hover shows label. |
| Mobile    | Full-width overlay | Slide-over with backdrop                           |

**Active Item**: Left 3px `--accent` border + `--accent-subtle` background + `--accent` text.
**Hover Item**: `--bg-tertiary` background, 150ms transition.
**Badge**: Accent-colored pill, max "99+".

**Animation**: Collapse/expand: width transitions via easeInOut 200ms (AP: Section 7). Active indicator slides between items via springResponsive. Badge counts animate via springBouncy on change.

**Accessibility**

- `role="navigation"`, `aria-label="Main navigation"`.
- Collapse toggle: `aria-label="Collapse sidebar"` / `"Expand sidebar"`, `aria-expanded`.
- Active item: `aria-current="page"`.
- Keyboard: `[` hotkey toggles collapse. Standard tab order through items.
- Badge counts announced: `aria-label="Packages, 12 unread"`.

---

### 4.2 SidebarItem

Individual navigation item within the Sidebar. Extracted for use in custom sidebar compositions.

```tsx
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
  collapsed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
```

**Dimensions**: Height 40px. Full-width clickable area. Icon 20px, 12px left margin (expanded) or centered (collapsed). Label: Body (15px, 400). Badge: right-aligned, 20px pill.

---

### 4.3 Header

Top bar with breadcrumbs, search, and actions.

```tsx
interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode; // Right-aligned action buttons
  showSearch?: boolean; // Shows command palette trigger. Default: true
  showNotifications?: boolean; // Shows NotificationBell. Default: true
}
```

**Dimensions**: Height 64px. Full-width, fixed top. Background `--bg-primary`. Bottom border 1px `--border-subtle`. Z-index `--z-header` (30). Padding 0 32px.

**Layout**: Left: hamburger (mobile) or breadcrumbs. Center: empty (content area below). Right: search trigger + notification bell + user menu.

---

### 4.4 Breadcrumb

Page location hierarchy.

```tsx
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number; // Collapse middle items to "..." Default: 4
}

interface BreadcrumbItem {
  label: string;
  href?: string; // Last item has no href (current page)
  icon?: React.ReactNode;
}
```

**Rendering**: Items separated by ChevronRight (12px, `--text-tertiary`). Link items: `--text-secondary`, underline on hover. Current item: `--text-primary`, no link.

**Accessibility**

- `nav` element with `aria-label="Breadcrumb"`.
- `aria-current="page"` on last item.
- Collapsed items accessible via dropdown.

---

### 4.5 Tabs

Content section switcher.

```tsx
interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  variant?: 'underline' | 'pills'; // Default: "underline"
  size?: 'sm' | 'md';
  fullWidth?: boolean; // Tabs stretch to fill container
  onChange?: (value: string) => void;
}

interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}
```

**Underline Variant**: Active tab has 2px `--accent` bottom border. Text `--accent`, 600 weight. Inactive: `--text-secondary`, 400 weight.

**Pills Variant**: Active tab has `--accent-subtle` background, `--accent` text. Inactive: no background.

**Animation**: Underline indicator slides between tabs via springResponsive (AP: Section 7). Pills: background cross-fades 150ms.

**Accessibility**

- Built on Radix `Tabs`.
- `role="tablist"`, `role="tab"`, `role="tabpanel"`.
- Arrow keys navigate between tabs. `Tab` moves to tab panel.
- `aria-selected="true"` on active tab.

---

### 4.6 Pagination

Page navigation for data tables and lists.

```tsx
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageSize?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  showTotal?: boolean; // "Showing 1-25 of 1,987"
  totalItems?: number;
}
```

**Layout**: Left: total count text (Caption). Right: previous button + page numbers (max 5 + ellipsis) + next button.

**Page Numbers**: Current page: `--accent` background, white text, pill shape. Other pages: ghost buttons.

**Accessibility**

- `nav` element with `aria-label="Pagination"`.
- Current page: `aria-current="page"`.
- Previous/Next: `aria-label="Go to previous page"` / `"Go to next page"`. Disabled when at bounds.
- Page buttons: `aria-label="Go to page N"`.

---

### 4.7 CommandPalette

Global search and quick-action keyboard interface.

```tsx
interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string; // Default: "Search or type a command..."
  recentSearches?: string[];
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string; // "Ctrl+K"
  onSelect: () => void;
}
```

**Dimensions**: Width 640px, centered. Max-height 480px. Scrollable list. Border-radius 16px. Shadow `--shadow-4`. Backdrop: `rgba(0, 0, 0, 0.4)`.

**Trigger**: `Ctrl+K` (Windows) / `Cmd+K` (Mac). Also accessible via search icon in Header.

**Layout**: Search input (48px height, no border, large font) at top. Divider. Scrollable grouped results below.

**Animation**: Appears via springGentle (scale 0.98 to 1.0 + fade). Results filter in real-time.

**Accessibility**

- `role="combobox"` on input, `role="listbox"` on results.
- `aria-activedescendant` tracks highlighted item.
- Arrow keys navigate. `Enter` selects. `Escape` closes.
- Group headings announced as list groupings.

---

### 4.8 DropdownMenu

Contextual action menu triggered by a button.

```tsx
interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end'; // Default: "end"
  side?: 'top' | 'bottom'; // Default: "bottom"
}

type DropdownItem =
  | {
      type: 'item';
      label: string;
      icon?: React.ReactNode;
      shortcut?: string;
      disabled?: boolean;
      destructive?: boolean;
      onSelect: () => void;
    }
  | { type: 'separator' }
  | { type: 'label'; text: string };
```

**Dimensions**: Min-width 180px, max-width 280px. Item height 36px. Padding 4px. Border-radius 10px. Shadow `--shadow-2`.

**Item States**: Hover/focus: `--bg-secondary` background. Destructive items: `--color-error` text and icon.

**Animation**: Enter via springGentle (AP: Section 8). Fade in 150ms.

**Accessibility**

- Built on Radix `DropdownMenu`.
- Full keyboard navigation. `Enter`/`Space` to select.
- `Escape` closes, returns focus to trigger.
- Destructive items announced with "destructive" context.

---

### 4.9 ContextMenu

Right-click contextual menu. Same API as DropdownMenu but triggered by right-click.

```tsx
interface ContextMenuProps {
  children: React.ReactNode; // The area that triggers on right-click
  items: DropdownItem[]; // Same item type as DropdownMenu
}
```

**Behavior**: Opens at cursor position on right-click. Same styling and animation as DropdownMenu.

**Accessibility**

- Built on Radix `ContextMenu`.
- Keyboard alternative: `Shift+F10` or dedicated menu button.

---

### 4.10 StepIndicator

Interactive multi-step navigation for wizards and onboarding flows.

```tsx
interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void; // If set, completed steps are clickable
  variant?: 'horizontal' | 'vertical';
}

interface StepConfig {
  label: string;
  description?: string;
  optional?: boolean;
  completed?: boolean;
  error?: boolean;
}
```

**Behavior**: Unlike ProgressIndicator (Section 3.10), StepIndicator is interactive. Completed steps can be clicked to navigate back. Current step is emphasized. Future steps are non-interactive.

**Accessibility**

- Each step is a button (completed) or static text (upcoming).
- `aria-current="step"` on current.
- `aria-disabled="true"` on future steps.

---

## 5. Layout

### 5.1 PageShell

Top-level layout wrapper. Renders Sidebar + Header + content area.

```tsx
interface PageShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  fullWidth?: boolean; // No max-width constraint. Default: true for monitor.
}
```

**Layout**: Fixed sidebar left. Fixed header top. Content area fills remaining space. Content scrolls independently. See `DESIGN-SYSTEM.md` Section 4.2 and `RESPONSIVE-BREAKPOINTS.md` Section 2.

**Dimensions**: Sidebar 240px (expanded) or 64px (collapsed). Header 64px. Content padding 32px. 12-column grid for content, 24px gutter.

---

### 5.2 SectionHeader

Header for content sections within a page.

```tsx
interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode; // Right-aligned button or link
  badge?: React.ReactNode; // Count or status next to title
  level?: 1 | 2 | 3; // Maps to heading element h1/h2/h3
}
```

**Typography by Level**

| Level | Element | Font                 |
| ----- | ------- | -------------------- |
| 1     | `<h1>`  | 34px / 700 (Display) |
| 2     | `<h2>`  | 22px / 600 (Title 2) |
| 3     | `<h3>`  | 20px / 600 (Title 3) |

Description: Body (15px, 400), `--text-secondary`. Margin bottom: 24px to content below.

---

### 5.3 Grid

CSS Grid layout utility.

```tsx
interface GridProps {
  children: React.ReactNode;
  columns?:
    | number
    | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; monitor?: number };
  gap?: number | string; // Default: 24px
  rowGap?: number | string;
  columnGap?: number | string;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}
```

**Implementation**: Renders a `<div>` with `display: grid`. Responsive columns use `repeat(auto-fill, minmax(Xpx, 1fr))` or explicit `grid-template-columns` based on props.

**Usage Guidelines**

- DO: Use for page layouts, card grids, stat card rows.
- DON'T: Use for inline form layouts; use Stack instead.

---

### 5.4 Stack

Flex-based linear layout.

```tsx
interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column'; // Default: "column"
  gap?: number | string; // Default: 16px
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  as?: React.ElementType; // Default: "div"
}
```

---

### 5.5 Divider

Visual separator between content sections.

```tsx
interface DividerProps {
  orientation?: Orientation; // Default: "horizontal"
  decorative?: boolean; // Default: true (aria-hidden)
  label?: string; // Centered text within divider (e.g., "OR")
  className?: string;
}
```

**Appearance**: 1px `--border-subtle`. Full-width (horizontal) or full-height (vertical). With label: text centered with line broken on either side.

**Accessibility**: `role="separator"` when not decorative. `aria-hidden="true"` when decorative.

---

### 5.6 Spacer

Explicit empty space. Preferred over margin hacks for layout spacing.

```tsx
interface SpacerProps {
  size: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // Maps to --space-1 through --space-9
  axis?: 'horizontal' | 'vertical'; // Default: "vertical"
}
```

---

### 5.7 Container

Max-width content wrapper.

```tsx
interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean; // Default: true (adds horizontal padding)
  center?: boolean; // Default: true (margin auto)
  className?: string;
}
```

**Max-Width Values**

| Size   | Max-Width   |
| ------ | ----------- |
| `sm`   | 640px       |
| `md`   | 768px       |
| `lg`   | 1024px      |
| `xl`   | 1280px      |
| `full` | None (100%) |

**Note**: On monitor breakpoint (1920px+), pages use `full` width to maximize data density. Container is used primarily for centered content like auth pages and marketing.

---

### 5.8 AspectRatio

Enforced aspect ratio container for images and media.

```tsx
interface AspectRatioProps {
  ratio: number; // Width / height. e.g., 16/9, 1/1, 4/3
  children: React.ReactNode;
  className?: string;
}
```

**Implementation**: Uses `aspect-ratio` CSS property with `padding-bottom` fallback.

---

### 5.9 ScrollArea

Custom-styled scrollable area with thin, auto-hiding scrollbar.

```tsx
interface ScrollAreaProps {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
  maxHeight?: string | number;
  className?: string;
}
```

**Scrollbar Style**: 6px wide, 999px border-radius. Track: transparent. Thumb: neutral-300, darkens to neutral-400 on hover. Fades in on scroll, fades out after 1s idle.

**Accessibility**

- Built on Radix `ScrollArea`.
- Maintains native scrollbar keyboard behavior.
- `tabindex="0"` for keyboard scrolling when not containing focusable elements.

---

## 6. Forms

### 6.1 FormField

Wrapper providing label, help text, error messaging, and layout for any input.

```tsx
interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean; // Show "(optional)" text
  helpText?: string;
  error?: string; // Error message. Presence triggers error state.
  children: React.ReactNode; // The input component
  className?: string;
}
```

**Layout**: Label above input. 6px gap between label and input. 4px gap between input and help/error text. See `DESIGN-SYSTEM-v2.md` Section 8.4.

**Error Behavior**: Error message replaces help text. Input receives `aria-invalid="true"` and `aria-describedby` pointing to error message ID. Error icon (AlertCircle, 14px) precedes error text. Error slides in from 0 height over 200ms (AP: MI-05).

**Accessibility**

- `<label>` element with `htmlFor` linking to input.
- Required: asterisk in `--color-error`. Also `aria-required="true"` on input.
- Help text connected via `aria-describedby`.
- Error announced via `aria-live="polite"`.

---

### 6.2 FormSection

Groups related fields with optional header and dividers.

```tsx
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}
```

**Layout**: See `DESIGN-SYSTEM-v2.md` Section 5.2 (FormSection Composition). Title in Title 3 (20px, 600). Description in Body `--text-secondary`. 16px gap to first field. 20px gap between fields. 24px divider margin when between sections.

**Collapsible**: ChevronDown icon rotates 180deg on collapse/expand. Content animates height via springGentle.

---

### 6.3 InlineEdit

Click-to-edit text that transitions between display and input mode.

```tsx
interface InlineEditProps {
  value: string;
  displayAs?: 'text' | 'heading'; // Typography style
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  onSave: (value: string) => Promise<void> | void;
  onCancel?: () => void;
  editTrigger?: 'click' | 'doubleClick'; // Default: "click"
}
```

**States**

| State   | Rendering                                                               |
| ------- | ----------------------------------------------------------------------- |
| Display | Text value with subtle pencil icon on hover. Dashed underline on hover. |
| Editing | Input field (same dimensions as display text) with save/cancel buttons. |
| Saving  | Input disabled, spinner next to save button.                            |

**Animation**: Transition between display and edit modes via cross-fade (150ms).

**Accessibility**

- Display mode: `role="button"`, `aria-label="Click to edit [field name]"`.
- Edit mode: Standard input accessibility. `Enter` saves, `Escape` cancels.

---

### 6.4 SearchInput

Specialized input for search with clear button and keyboard shortcut hint.

```tsx
interface SearchInputProps extends BaseInteractiveProps {
  value?: string;
  placeholder?: string; // Default: "Search..."
  size?: 'sm' | 'md' | 'lg';
  shortcutHint?: string; // e.g., "Ctrl+K" displayed as badge inside input
  loading?: boolean; // Shows spinner while searching
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number; // Default: 300
}
```

**Layout**: Search icon (20px) at left. Input text. Shortcut hint badge at right (idle state). Clear button (X, 16px) at right (when value exists).

**Accessibility**

- `role="searchbox"`.
- `aria-label="Search"`.
- Clear button: `aria-label="Clear search"`.

---

### 6.5 UnitSelector

Specialized autocomplete for selecting building units.

```tsx
interface UnitSelectorProps extends BaseInteractiveProps {
  value?: string; // Unit ID
  building?: string; // Pre-filter to building
  showOccupants?: boolean; // Show resident names in dropdown
  error?: boolean;
  onChange?: (unitId: string) => void;
}
```

**Dropdown**: Shows unit number + floor + primary resident name. Grouped by floor. Type-ahead filters as user types. Most recently accessed units shown as "Recent" group at top.

**Accessibility**

- Full combobox pattern with `aria-autocomplete="list"`.
- Each option: `aria-label="Unit 1205, Floor 12, Sarah Chen"`.

---

### 6.6 ResidentSelector

Specialized autocomplete for selecting residents.

```tsx
interface ResidentSelectorProps extends BaseInteractiveProps {
  value?: string; // Resident ID
  unitFilter?: string; // Pre-filter to unit
  multiple?: boolean;
  error?: boolean;
  onChange?: (residentId: string | string[]) => void;
}
```

**Dropdown**: Avatar (xs) + name + unit number. Search matches on name, unit number, email.

**Accessibility**

- Full combobox pattern. Multiple selection uses tag display with remove buttons.

---

### 6.7 Combobox

Generic autocomplete/typeahead select.

```tsx
interface ComboboxProps extends BaseInteractiveProps {
  options: ComboboxOption[];
  value?: string | string[];
  multiple?: boolean;
  placeholder?: string;
  searchable?: boolean; // Default: true
  creatable?: boolean; // Allow creating new options
  loading?: boolean;
  error?: boolean;
  onSearch?: (query: string) => void;
  onChange?: (value: string | string[]) => void;
  onCreate?: (value: string) => void;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
}

interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  group?: string;
}
```

**Behavior**: Input with dropdown. Typing filters options. Selected options display as Tags (when multiple) or as input value (when single). `creatable` adds "Create [typed text]" option at bottom.

**Accessibility**

- `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`.
- `aria-activedescendant` tracks highlighted option.
- Full keyboard navigation: Arrow keys, Enter to select, Escape to close.

---

### 6.8 TagInput

Multi-value input rendered as removable tags.

```tsx
interface TagInputProps extends BaseInteractiveProps {
  value?: string[];
  placeholder?: string;
  maxTags?: number;
  allowDuplicates?: boolean; // Default: false
  suggestions?: string[];
  error?: boolean;
  onChange?: (tags: string[]) => void;
}
```

**Behavior**: Tags render inline within the input container. New tags created by pressing Enter or comma. Backspace removes the last tag. Suggestions dropdown appears while typing.

**Accessibility**

- Container: `role="listbox"` when suggestions visible.
- Tags: `role="option"` with remove buttons.
- Input announces tag count: "3 tags entered".

---

### 6.9 RichTextEditor

WYSIWYG text editor for announcements, descriptions, and long-form content.

```tsx
interface RichTextEditorProps extends BaseInteractiveProps {
  value?: string; // HTML string
  placeholder?: string;
  toolbar?: (
    | 'bold'
    | 'italic'
    | 'underline'
    | 'heading'
    | 'list'
    | 'orderedList'
    | 'link'
    | 'image'
  )[];
  maxLength?: number;
  minHeight?: number; // Default: 200
  maxHeight?: number; // Default: 500
  error?: boolean;
  onChange?: (html: string) => void;
}
```

**Toolbar**: Compact icon toolbar above editor area. Active formatting: `--accent` icon. Separator between groups. Toolbar sticks to top of editor on scroll.

**Accessibility**

- `role="textbox"`, `aria-multiline="true"`, `contenteditable`.
- Toolbar buttons have `aria-label` and `aria-pressed` for toggle states.
- All formatting available via keyboard shortcuts (Ctrl+B, Ctrl+I, etc.).

---

### 6.10 SignaturePad

Canvas-based signature capture.

```tsx
interface SignaturePadProps extends BaseInteractiveProps {
  value?: string; // Data URL (base64 PNG)
  width?: number; // Default: 100% of parent
  height?: number; // Default: 200
  penColor?: string; // Default: "--text-primary"
  penWidth?: number; // Default: 2
  error?: boolean;
  onChange?: (dataUrl: string) => void;
  onClear?: () => void;
}
```

**Layout**: Canvas with dashed 1px `--border-subtle` border, 10px border-radius. "Sign here" placeholder text (Caption, `--text-tertiary`, centered) visible when empty. Clear button (ghost, "Clear") bottom-right.

**Accessibility**

- `aria-label="Signature pad. Draw your signature using mouse or touch."`.
- Clear button: `aria-label="Clear signature"`.
- Alternative: text input fallback for users who cannot draw (link below canvas: "Type your name instead").

---

## 7. Specialized

### 7.1 PackageCard

Card optimized for package display in the event log grid.

```tsx
interface PackageCardProps {
  packageId: string;
  referenceNumber: string;
  unit: string;
  residentName: string;
  courierName: string;
  courierIcon?: React.ReactNode; // Amazon, FedEx, UPS, etc.
  status: 'received' | 'notified' | 'released' | 'returned';
  receivedAt: Date;
  releasedAt?: Date;
  releasedTo?: string;
  storageLocation?: string;
  hasPhoto?: boolean;
  hasSignature?: boolean;
  onClick?: () => void;
}
```

**Layout**: Left accent border (3px, blue event-type color). Top row: courier icon (24px) + reference number (monospace). Middle: resident name + unit. Bottom: status badge + timestamp. Right edge: photo/signature indicators.

**Animation**: Card hover lift (AP: MI-03). Status badge transitions color smoothly on status change.

**Accessibility**

- `role="article"`, `aria-label` combining reference number and status.
- All information available as text (courier icon is decorative, icon + text label provided).

---

### 7.2 EventCard

Generic card for the unified event log.

```tsx
interface EventCardProps {
  eventId: string;
  eventType: string;
  eventTypeColor: string; // OKLCH or hex
  eventTypeIcon: React.ReactNode;
  title: string;
  description?: string;
  unit?: string;
  resident?: string;
  createdAt: Date;
  createdBy: string;
  status: 'open' | 'closed';
  notificationSent?: boolean;
  onClick?: () => void;
}
```

**Layout**: Left accent border (3px, `eventTypeColor`). Event type icon (20px) + type label (Caption, uppercase). Title (Headline). Description (Callout, 2-line clamp). Footer: unit/resident + timestamp + status.

---

### 7.3 MaintenanceCard

Card for service/maintenance requests.

```tsx
interface MaintenanceCardProps {
  requestId: string;
  referenceNumber: string;
  title: string;
  category: string;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'on_hold' | 'closed';
  assignee?: { name: string; avatar?: string };
  createdAt: Date;
  hasPhotos?: boolean;
  onClick?: () => void;
}
```

**Priority Indicator**: Color-coded left border (low: success, medium: info, high: warning, urgent: error) + priority badge at top.

---

### 7.4 SecurityActionButton

Quick-action button for the security console. Large touch target for fast operation.

```tsx
interface SecurityActionButtonProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  color: string; // Event type color
  onClick: () => void;
  badge?: number; // Active count
}
```

**Dimensions**: 120px wide, 100px tall. Centered icon (32px) + label (Caption, 12px) below. Colored top border (3px). Hover: subtle background tint of the color. Active: scale(0.97).

**Accessibility**

- `role="button"`.
- `aria-label` combining label and badge: "Parcels, 5 active".

---

### 7.5 ShiftNote

Display component for shift handoff notes.

```tsx
interface ShiftNoteProps {
  id: string;
  content: string;
  author: { name: string; role: string; avatar?: string };
  createdAt: Date;
  priority?: 'normal' | 'important';
  acknowledged?: boolean;
  onAcknowledge?: () => void;
}
```

**Layout**: Author avatar + name + role + timestamp header. Content body (Body text). Important notes: warning-50 background + left 3px warning border. Acknowledge button (ghost) when applicable.

---

### 7.6 AmenityCalendar

Calendar grid for amenity booking visualization.

```tsx
interface AmenityCalendarProps {
  view: 'day' | 'week' | 'month';
  date: Date;
  bookings: CalendarBooking[];
  amenities: Amenity[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  onBookingClick: (bookingId: string) => void;
  onSlotClick: (date: Date, amenityId: string) => void;
}

interface CalendarBooking {
  id: string;
  amenityId: string;
  title: string;
  start: Date;
  end: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  resident?: string;
}
```

**Day View**: Time slots (30min increments) on Y-axis, amenities on X-axis. Bookings render as colored blocks.
**Week View**: 7 columns (days), time slots on Y-axis.
**Month View**: Standard calendar grid, bookings as colored dots or compact labels.

**Accessibility**

- `role="grid"` with `aria-label="Amenity booking calendar"`.
- Arrow keys navigate between cells.
- Each booking: `aria-label` with full details.
- Screen reader mode: list view of bookings for the selected date.

---

### 7.7 NotificationBell

Header notification indicator with dropdown panel.

```tsx
interface NotificationBellProps {
  unreadCount: number;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onNotificationClick: (id: string) => void;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  icon?: React.ReactNode;
  type: 'package' | 'maintenance' | 'booking' | 'announcement' | 'security' | 'system';
  actionUrl?: string;
}
```

**Bell Icon**: 24px. Badge: red circle with white count text (max "99+"). Badge bounces on new notification (AP: springBouncy).

**Panel**: 400px wide, max-height 480px. Header: "Notifications" + "Mark all read" ghost link. List of notification items. Each item: icon + title + description (1-line clamp) + timestamp. Unread: accent-subtle left border.

**Accessibility**

- Bell: `aria-label="Notifications, N unread"`.
- Panel: `role="region"`, `aria-label="Notification center"`.
- New notifications announced via `aria-live="polite"`.

---

### 7.8 PropertySwitcher

Building/property selector for multi-property deployments.

```tsx
interface PropertySwitcherProps {
  currentProperty: Property;
  properties: Property[];
  onChange: (propertyId: string) => void;
}

interface Property {
  id: string;
  name: string;
  address: string;
  unitCount: number;
  logo?: string;
}
```

**Trigger**: Current property name + chevron in sidebar header or header bar. Dropdown: property logo/avatar + name + address + unit count per row.

**Accessibility**

- Combobox pattern for searchable property list.
- `aria-label="Switch property"`.

---

### 7.9 RoleBadge

Displays a user's role with appropriate visual treatment.

```tsx
interface RoleBadgeProps {
  role:
    | 'super_admin'
    | 'admin'
    | 'property_manager'
    | 'concierge'
    | 'security'
    | 'board_member'
    | 'resident'
    | 'owner';
  size?: 'sm' | 'md';
}
```

**Color Mapping**

| Role               | Color        | Icon        |
| ------------------ | ------------ | ----------- |
| `super_admin`      | Purple       | Shield      |
| `admin`            | Purple-light | ShieldCheck |
| `property_manager` | Blue         | Building    |
| `concierge`        | Teal         | Desk        |
| `security`         | Amber        | Lock        |
| `board_member`     | Indigo       | Users       |
| `resident`         | Green        | Home        |
| `owner`            | Green-dark   | Key         |

---

### 7.10 UnitPopover

Rich popover showing unit details on hover/click.

```tsx
interface UnitPopoverProps {
  unitId: string;
  unitNumber: string;
  floor?: number;
  building?: string;
  occupants?: { name: string; role: string; avatar?: string }[];
  instructions?: string[]; // Per-unit front desk instructions
  activeEvents?: number;
  children: React.ReactNode; // Trigger (usually the unit number text)
}
```

**Content**: Unit number (Title 3) + floor/building. Occupant list with avatars. Instructions highlighted with warning background if present. Active event count.

**Trigger**: Hover (300ms delay) or click. Popover side: right (default).

**Accessibility**

- Follows Popover accessibility pattern.
- Instructions are critical info — also available in unit detail page (popover is supplementary).

---

## 8. Composite

### 8.1 PageHeader

Standard page-level header combining title, description, breadcrumbs, and actions.

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode; // Primary + secondary buttons
  tabs?: TabItem[]; // Tabs below header (page-level tab navigation)
  activeTab?: string;
  onTabChange?: (value: string) => void;
  badge?: React.ReactNode; // Count or status next to title
}
```

**Layout**: Breadcrumbs (Caption) top. Title (Display, 34px, 700) + optional badge. Description (Body, `--text-secondary`). Actions right-aligned at title level. Tabs below with divider.

**Spacing**: Breadcrumbs to title: 8px. Title to description: 4px. Title row to tabs: 24px. Tabs to content: 0 (tabs border serves as divider).

---

### 8.2 FilterBar

Horizontal filter controls for data tables and lists.

```tsx
interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onClearAll: () => void;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

interface FilterConfig {
  id: string;
  label: string;
  type: 'select' | 'multiSelect' | 'dateRange' | 'toggle';
  options?: { value: string; label: string }[];
}
```

**Layout**: Horizontal row of filter chips. Each chip: label + current value (truncated) + chevron. Active filters have `--accent-subtle` background. "Clear all" ghost button at end when any filter active.

**Active Filter Count**: Badge on FilterBar showing total active filters.

**Animation**: Filter chips animate in/out via layout animation (AP: Section 13).

**Accessibility**

- `role="toolbar"`, `aria-label="Filters"`.
- Each filter chip is a button opening a dropdown.
- "Clear all" announces: "Clear all filters, N active".

---

### 8.3 BulkActionBar

Floating action bar when table rows are selected.

```tsx
interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onDeselectAll: () => void;
}

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  onClick: () => void;
}
```

**Layout**: Fixed to bottom of viewport, 16px from edges. Height 48px. Border-radius 12px. Shadow `--shadow-3`. Background `--bg-primary`. Content: "[N] selected" text + action buttons + "Deselect all" ghost button.

**Animation**: Slides up from below viewport via springGentle when selection count goes from 0 to 1+. Exits by sliding down.

**Accessibility**

- `role="toolbar"`, `aria-label="Bulk actions for N selected items"`.
- Announced via `aria-live="polite"` when appearing.
- `Escape` deselects all.

---

### 8.4 QuickActionPanel

Grid of quick-action buttons for role-specific dashboards.

```tsx
interface QuickActionPanelProps {
  actions: QuickAction[];
  columns?: number; // Default: 4
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  badge?: number;
  color?: string;
}
```

**Layout**: CSS Grid of SecurityActionButton-style cards. Each card: icon (32px), label (Caption), optional badge, colored top border.

**Animation**: Cards enter via staggered scale-up (AP: Section 13).

---

### 8.5 DashboardWidget

Container for dashboard content blocks (charts, lists, stats).

```tsx
interface DashboardWidgetProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void }; // "View all" link
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
  span?: number; // Grid column span (3, 4, 6, 8, or 12)
}
```

**Layout**: Card (outlined variant, default padding). Header: title (Headline, 17px, 600) left, action link right. Content area below with 16px top gap.

**States**: Loading: skeleton content. Error: inline ErrorState with retry. Empty: inline EmptyState.

**Animation**: Widget enters via staggered fade-up (30ms stagger per widget in the grid).

---

### 8.6 SettingsPanel

Two-column settings layout: navigation left, content right.

```tsx
interface SettingsPanelProps {
  sections: SettingsSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

interface SettingsSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
}
```

**Layout**: SidebarDetailLayout composition (see `DESIGN-SYSTEM-v2.md` Section 5.2). Left panel: 240px, NavList of sections. Right panel: section content, scrollable.

**Animation**: Section content cross-fades on switch (150ms fade-out, 150ms fade-in).

**Accessibility**

- Left panel: `role="tablist"`, `aria-orientation="vertical"`.
- Each section: `role="tab"` (left) and `role="tabpanel"` (right).
- `aria-selected` on active section.

---

## Appendix A: Component-to-Token Quick Reference

| Token Category  | CSS Variable Pattern                                                  | Source Document                     |
| --------------- | --------------------------------------------------------------------- | ----------------------------------- |
| Colors (OKLCH)  | `--color-{scale}-{step}`                                              | DESIGN-SYSTEM-v2.md Section 1       |
| Semantic colors | `--color-success`, `--color-warning`, `--color-error`, `--color-info` | DESIGN-SYSTEM-v2.md Section 1.3-1.7 |
| Badge pairs     | `--badge-{status}-bg`, `--badge-{status}-text`                        | DESIGN-SYSTEM-v2.md Section 1.10    |
| Backgrounds     | `--bg-primary`, `--bg-secondary`, `--bg-tertiary`                     | DESIGN-SYSTEM.md Section 2.1        |
| Text            | `--text-primary`, `--text-secondary`, `--text-tertiary`               | DESIGN-SYSTEM.md Section 2.1        |
| Borders         | `--border-subtle`, `--border-focus`                                   | DESIGN-SYSTEM.md Section 2.1        |
| Accent          | `--accent`, `--accent-hover`, `--accent-pressed`, `--accent-subtle`   | DESIGN-SYSTEM.md Section 2.2        |
| Shadows         | `--shadow-0` through `--shadow-5`                                     | DESIGN-SYSTEM-v2.md Section 9       |
| Z-index         | `--z-base` through `--z-emergency`                                    | DESIGN-SYSTEM-v2.md Section 9.4     |
| Spacing         | `--space-1` through `--space-9`                                       | DESIGN-SYSTEM.md Section 4.1        |
| Spring presets  | `springSnappy`, `springResponsive`, `springGentle`                    | ANIMATION-PLAYBOOK.md Section 2     |
| Easing presets  | `easeFadeIn`, `easeFadeOut`, `easeOut`, `easeIn`                      | ANIMATION-PLAYBOOK.md Section 2     |
| Chart colors    | `--chart-1` through `--chart-6`                                       | DESIGN-SYSTEM-v2.md Section 6.2     |

## Appendix B: Radix UI Primitive Mapping

| Concierge Component | Radix Primitive                  | Notes                        |
| ------------------- | -------------------------------- | ---------------------------- |
| Select              | `@radix-ui/react-select`         | Full select with groups      |
| Checkbox            | `@radix-ui/react-checkbox`       | Indeterminate support        |
| Radio               | `@radix-ui/react-radio-group`    | —                            |
| Toggle              | `@radix-ui/react-switch`         | —                            |
| Tooltip             | `@radix-ui/react-tooltip`        | Provider at app root         |
| Popover             | `@radix-ui/react-popover`        | —                            |
| Dialog / Modal      | `@radix-ui/react-dialog`         | —                            |
| Sheet / Drawer      | `@radix-ui/react-dialog`         | Variant with slide animation |
| DropdownMenu        | `@radix-ui/react-dropdown-menu`  | Sub-menus supported          |
| ContextMenu         | `@radix-ui/react-context-menu`   | —                            |
| Tabs                | `@radix-ui/react-tabs`           | —                            |
| ScrollArea          | `@radix-ui/react-scroll-area`    | Custom scrollbar             |
| Slider              | `@radix-ui/react-slider`         | —                            |
| Combobox            | Custom (Radix Popover + Command) | No official Radix combobox   |
| CommandPalette      | `cmdk` (pacocoursey/cmdk)        | Built on Radix primitives    |

## Appendix C: Keyboard Shortcut Registry

| Shortcut              | Action                                           | Scope              |
| --------------------- | ------------------------------------------------ | ------------------ |
| `Cmd/Ctrl + K`        | Open Command Palette                             | Global             |
| `[`                   | Toggle sidebar collapse                          | Global             |
| `Escape`              | Close topmost overlay (modal, popover, dropdown) | Global             |
| `Cmd/Ctrl + Enter`    | Submit current form                              | Within form        |
| `Cmd/Ctrl + .`        | Toggle notification panel                        | Global             |
| `Cmd/Ctrl + /`        | Focus search input on current page               | Global             |
| `ArrowUp / ArrowDown` | Navigate list/menu items                         | Within listbox     |
| `Enter / Space`       | Select/activate focused element                  | Within interactive |
| `Tab / Shift+Tab`     | Move focus forward/backward                      | Global             |
| `Backspace`           | Remove last tag in TagInput                      | Within TagInput    |

---

## 9. Business Operations

### 9.1 OnboardingStepper

Horizontal stepper for multi-step onboarding wizards. Tracks progress across up to 8 steps with visual indicators for completed, active, skipped, and pending states.

```tsx
interface OnboardingStepperProps extends BaseInteractiveProps {
  steps: StepDefinition[];
  currentStep: number; // 0-indexed
  completedSteps: number[];
  skippedSteps?: number[];
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical'; // Default: horizontal
}

interface StepDefinition {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean; // Shows "(Optional)" below label
}
```

**Layout**: Horizontal bar with numbered circles (32px diameter) connected by lines (2px height, `--border-primary`). Each step: circle + label (Caption, 12px) + optional description (Caption, `--text-tertiary`). Total width: 100% of container, steps evenly distributed.

**Step States**

| State    | Circle                                               | Connector Line                                    | Label                        |
| -------- | ---------------------------------------------------- | ------------------------------------------------- | ---------------------------- |
| Pending  | `--border-primary` outline, `--text-tertiary` number | `--border-primary`                                | `--text-tertiary`            |
| Active   | `--accent` fill, white number                        | Left segment `--accent`, right `--border-primary` | `--text-primary`, 600 weight |
| Complete | `--accent` fill, white checkmark icon (16px)         | `--accent` solid                                  | `--text-primary`             |
| Skipped  | `--border-primary` outline, dash icon                | `--border-primary` dashed                         | `--text-tertiary`, italic    |

**Responsive**: Desktop (>= 1024px): all 8 steps visible. Tablet (768-1023px): show labels for current + 2 adjacent, icons only for rest. Mobile (< 768px): show current step + adjacent step indicators. Swipe gesture to scroll steps.

**Animation**: Step completion: circle scales 1.0 -> 1.15 -> 1.0 (springGentle), checkmark fades in (150ms). Connector line fills left-to-right (200ms ease-out). See AP: Section 8 for progress animations.

**Accessibility**

- `role="navigation"`, `aria-label="Onboarding progress"`.
- Each step: `role="listitem"`, `aria-current="step"` on active step.
- `aria-label` on each step combining label and state: "Step 3: Property Settings, completed".
- Clickable completed/skipped steps for non-linear navigation; pending steps not clickable.
- `Tab` moves between clickable steps, `Enter`/`Space` activates.

---

### 9.2 PricingCard

Plan comparison card for subscription selection. Displays plan name, pricing, feature checklist, and a call-to-action button.

```tsx
interface PricingCardProps extends BaseInteractiveProps {
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  annualDiscount?: number; // Percentage, e.g., 20
  features: PricingFeature[];
  highlighted?: boolean; // Adds "Popular" badge and accent border
  variant: 'starter' | 'professional' | 'enterprise';
  ctaLabel: string;
  onCtaClick: () => void;
  currentPlan?: boolean; // Shows "Current Plan" instead of CTA
}

interface PricingFeature {
  label: string;
  included: boolean;
  tooltip?: string; // Help text on hover
  limit?: string; // e.g., "Up to 500 units"
}
```

**Variants**

| Variant        | Border             | Background       | Badge                                 | CTA Variant |
| -------------- | ------------------ | ---------------- | ------------------------------------- | ----------- |
| `starter`      | `--border-primary` | `--bg-primary`   | None                                  | `secondary` |
| `professional` | `--accent` (2px)   | `--bg-primary`   | "Popular" (`--accent` bg, white text) | `primary`   |
| `enterprise`   | `--border-primary` | `--bg-secondary` | "Custom" (`--text-secondary` bg)      | `secondary` |

**Layout**: Card (320px width, auto height). Padding: 32px. Top: plan name (Headline, 17px, 600). Price: large display (Display, 34px, 700) with currency symbol (Body) and "/mo" or "/yr" suffix (Caption). Feature list: vertical stack, 12px gap. Each feature: checkmark (16px, `--success`) or x-mark (16px, `--text-tertiary`) + label (Body). CTA button full-width at bottom, 24px top margin.

**Popular Badge**: Positioned top-right corner, offset -8px vertically. Pill shape, 24px height, `--accent` background, white text (Caption, 600).

**Animation**: Billing cycle toggle: price cross-fades (150ms) with subtle scale pulse. Highlighted card: subtle shadow elevation on mount. Card hover: lift via AP: MI-03.

**Accessibility**

- `role="article"`, `aria-label` combining plan name and price.
- Feature tooltips accessible via focus (keyboard) and hover (mouse).
- CTA button has descriptive `aria-label`: "Select Professional plan at $299 per month".
- Current plan state: CTA replaced with static "Current Plan" badge, `aria-disabled="true"`.

---

### 9.3 DemoBadge

Persistent banner badge indicating the application is in demo or training mode. Prevents confusion between live and sandbox environments.

```tsx
interface DemoBadgeProps {
  mode: 'demo' | 'training';
  propertyName?: string; // Shown as "Demo: [propertyName]"
  onExit?: () => void; // Exit demo/training mode
  onReset?: () => void; // Reset demo data (demo mode only)
}
```

**Variants**

| Mode       | Background         | Text Color              | Icon                   | Actions                    |
| ---------- | ------------------ | ----------------------- | ---------------------- | -------------------------- |
| `demo`     | `#FF9500` (Orange) | White                   | BeakerIcon (16px)      | "Reset Data" + "Exit Demo" |
| `training` | `#FFD60A` (Yellow) | `--text-primary` (dark) | AcademicCapIcon (16px) | "End Training"             |

**Layout**: Full-width bar, 36px height, fixed to top of viewport above the main header. Content centered: icon + mode label (Caption, 12px, 700, uppercase tracking 0.08em) + optional property name (Caption, 400). Action buttons right-aligned (ghost variant, 28px height).

**Z-Index**: `--z-banner` (defined as 1100) — above header (1000) but below modals (1200) and toasts (1300).

**Behavior**: Never dismissible by clicking away. Persists across all page navigations. Main app content shifts down by 36px to accommodate. Action buttons require confirmation dialog before executing.

**Animation**: Slides down from top on mount (200ms, easeOut). No exit animation — instant removal on mode change.

**Accessibility**

- `role="status"`, `aria-live="polite"`.
- `aria-label="Application is in demo mode"` or `"Application is in training mode"`.
- Action buttons keyboard accessible, included in tab order.
- High contrast between text and background ensured for both variants.

---

### 9.4 PropertySwitcherDropdown

Enhanced header dropdown for multi-property users. Extends the base PropertySwitcher (7.8) with search, role badges, and admin management link.

```tsx
interface PropertySwitcherDropdownProps extends BaseInteractiveProps {
  properties: PropertyOption[];
  currentPropertyId: string;
  onSwitch: (propertyId: string) => void;
  onManage?: () => void; // "Manage Properties" link (Admin only)
  loading?: boolean;
}

interface PropertyOption {
  id: string;
  name: string;
  address: string;
  unitCount: number;
  logo?: string;
  role: string; // User's role at this property
  roleColor: string; // Role badge color (matches RoleBadge 7.9)
  unreadCount?: number; // Pending notifications for this property
}
```

**Trigger**: Current property name (Headline, 17px, 600) + chevron-down icon (16px) in the header bar. Chevron rotates 180deg when open.

**Dropdown Panel**: Width 360px, max-height 480px. Border-radius 12px. Shadow `--shadow-3`. Background `--bg-primary`.

**Search**: Visible when `properties.length > 5`. Input at top with SearchIcon, 40px height, `--bg-secondary` background. Filters by name and address. Placeholder: "Search properties...".

**Property Row**: 56px height, 16px horizontal padding. Left: property logo/avatar (36px circle) or initials fallback. Center: property name (Body, 600) + address (Caption, `--text-secondary`). Right: RoleBadge (compact) + optional unread count badge (red dot, 8px).

**Current Property**: Row has `--accent-subtle` background, checkmark icon (16px, `--accent`) far right.

**Footer**: Divider + "Manage Properties" link (Caption, `--accent`). Only rendered when `onManage` is provided. Padding: 12px 16px.

**Animation**: Dropdown enters via scaleY from top (AP: Section 5). Chevron rotation: 200ms ease.

**Accessibility**

- Combobox pattern: `role="combobox"` on trigger, `role="listbox"` on dropdown.
- `aria-expanded` toggles on trigger.
- `ArrowUp`/`ArrowDown` navigate options, `Enter` selects, `Escape` closes.
- Search input: `aria-label="Search properties"`.
- Each option: `aria-selected` on current property.
- Focus trapped within dropdown when open.

---

### 9.5 HelpDrawer

Slide-out right panel providing contextual help articles, search, and documentation links. Appears as an overlay on mobile and a push-panel on desktop.

```tsx
interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articles: HelpArticle[];
  currentPage?: string; // Current route for contextual filtering
  onSearch?: (query: string) => void;
  onArticleClick: (articleId: string) => void;
  recentArticles?: HelpArticle[];
  loading?: boolean;
}

interface HelpArticle {
  id: string;
  title: string;
  excerpt: string; // 2-line max
  readTime: number; // Minutes
  category: string;
  tags: string[];
  url?: string; // External link to full article
}
```

**Layout**: Panel fixed to right edge of viewport. Width: 400px (desktop), 100vw (mobile < 768px). Height: 100vh. Background: `--bg-primary`. Shadow: `--shadow-4` on left edge. Z-index: `--z-drawer` (1150).

**Header**: 56px height. Title "Help" (Headline, 17px, 600). Close button (IconButton, ghost, X icon) right-aligned. Bottom border `--border-primary`.

**Search Section**: Below header, 16px padding. SearchInput (full width) with magnifying glass icon. Placeholder: "Search help articles...".

**Contextual Articles Section**: Label "Related to this page" (Caption, 600, `--text-secondary`, uppercase). Filtered by `currentPage` matching article tags. Max 3 articles shown.

**Article Card**: Padding 12px 16px. Title (Body, 600, 1-line clamp). Excerpt (Callout, `--text-secondary`, 2-line clamp). Footer: category badge (pill, `--bg-secondary`) + read time (Caption, `--text-tertiary`). Divider between cards.

**Recent Articles Section**: Label "Recently viewed" (Caption, 600). Max 5 articles.

**Mobile Behavior**: Full-screen overlay with `--bg-overlay` backdrop (rgba black, 0.4 opacity). Swipe right to dismiss.

**Animation**: Panel slides in from right (300ms, easeOut). Backdrop fades in (200ms). See AP: Section 6 for drawer transitions.

**Accessibility**

- `role="complementary"`, `aria-label="Help panel"`.
- Focus trap when open. Focus moves to search input on open.
- `Escape` closes the drawer.
- Articles are `role="link"` with descriptive `aria-label` including title and read time.
- Backdrop click closes drawer (desktop only).

---

### 9.6 RoleSwitcher

Demo-mode-only overlay for quickly switching between role personas. Allows stakeholders to preview the application as different user types during demos and training.

```tsx
interface RoleSwitcherProps {
  currentRole: RoleType;
  availableRoles: RoleOption[];
  onSwitch: (role: RoleType) => void;
  isDemo: boolean; // Only renders when true
}

type RoleType = 'concierge' | 'security' | 'property_manager' | 'board_member' | 'resident';

interface RoleOption {
  role: RoleType;
  label: string;
  description: string; // Brief role summary, e.g., "Front desk operations"
  icon: React.ReactNode;
  color: string; // Matches RoleBadge color mapping (7.9)
}
```

**Behavior**: Only renders when `isDemo === true`. Returns `null` in production mode.

**FAB Trigger**: Floating action button, 56px diameter, positioned bottom-right (24px from edges). Background: `--accent`. Icon: UsersIcon (24px, white). Shadow: `--shadow-3`. Tooltip on hover: "Switch Role".

**Overlay Panel**: Appears above FAB. Width: 320px. Border-radius: 16px. Shadow: `--shadow-4`. Background: `--bg-primary`. Padding: 24px.

**Header**: "Switch Role" (Headline, 17px, 600). "Preview as a different user" (Callout, `--text-secondary`). 16px bottom margin.

**Role Cards**: Vertical stack, 8px gap. Each card: 64px height, 12px padding, border-radius 8px. Left: role icon (24px, role color). Center: role label (Body, 600) + description (Caption, `--text-secondary`). Border: `--border-primary`. Hover: `--bg-secondary` background.

**Active Role Card**: Border changes to role color (2px). Left: filled role icon. Checkmark icon (16px, role color) far right.

**Animation**: FAB pulse animation every 10s in demo mode to draw attention (scale 1.0 -> 1.05, 600ms). Panel fans out from FAB origin: scaleY(0) -> scaleY(1) with transform-origin bottom-right (250ms, springGentle). Cards stagger in (50ms per card). See AP: Section 10 for overlay animations.

**Accessibility**

- FAB: `role="button"`, `aria-label="Switch user role"`, `aria-expanded`.
- Panel: `role="radiogroup"`, `aria-label="Available roles"`.
- Each card: `role="radio"`, `aria-checked` on current role.
- `ArrowUp`/`ArrowDown` navigate cards, `Enter`/`Space` selects.
- `Escape` closes the panel.
- Focus trapped in panel when open.

---

### 9.7 BillingWidget

Dashboard widget displaying subscription plan status, resource usage meters, and upcoming invoice information. Composed of three sub-variants that can be used independently or together.

```tsx
interface BillingWidgetProps extends BaseInteractiveProps {
  plan: PlanInfo;
  usageMetrics: UsageMetric[];
  nextInvoice?: InvoiceInfo;
  trialDaysRemaining?: number; // Shows trial countdown when present
  onUpgrade?: () => void;
  onViewBilling?: () => void;
}

interface PlanInfo {
  name: string;
  tier: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  price: number;
}

interface UsageMetric {
  label: string; // e.g., "Units", "Storage", "Staff accounts"
  current: number;
  limit: number;
  unit?: string; // e.g., "GB", "users"
}

interface InvoiceInfo {
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'upcoming' | 'overdue' | 'paid';
}
```

**Sub-Variants**

| Sub-variant | Usage                  | Content                             |
| ----------- | ---------------------- | ----------------------------------- |
| PlanBadge   | Compact plan indicator | Plan name pill + billing cycle      |
| UsageMeter  | Resource usage bars    | Horizontal progress bars per metric |
| InvoiceCard | Next payment preview   | Amount + due date + status          |

**PlanBadge**: Pill shape, 28px height. Plan name (Caption, 600) + tier icon. Background: starter = `--bg-secondary`, professional = `--accent-subtle`, enterprise = `--bg-primary` with `--border-primary`.

**UsageMeter**: Each metric row: label (Caption, `--text-secondary`) left, "current/limit unit" (Caption, 600) right. Below: horizontal bar (8px height, border-radius 4px, `--bg-tertiary` track). Fill color thresholds: 0-79% = `--accent`, 80-94% = `--warning`, 95-100% = `--error`. Bar width animates on value change.

**InvoiceCard**: Compact card within widget. Amount (Title 3, 600). Due date (Caption, `--text-secondary`). Status badge: upcoming = `--info`, overdue = `--error`, paid = `--success`.

**Trial Mode**: When `trialDaysRemaining` is present, shows countdown badge above plan info. Badge: pill, `--warning` background when <= 7 days, `--error` when <= 3 days. Text: "N days left in trial" (Caption, 600).

**Animation**: Usage bars animate width on mount (400ms, easeOut). Trial countdown badge pulses gently when <= 3 days. See AP: Section 8.

**Accessibility**

- Widget: `role="region"`, `aria-label="Billing overview"`.
- Usage meters: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`.
- Color thresholds supplemented with text labels ("Warning: approaching limit") for screen readers.
- Invoice status communicated via `aria-label`, not color alone.

---

### 9.8 ImportProgress

Multi-phase progress indicator for CSV file imports. Guides users through upload, validation, error review, import execution, and completion.

```tsx
interface ImportProgressProps extends BaseInteractiveProps {
  status: 'idle' | 'uploading' | 'validating' | 'importing' | 'complete' | 'error';
  progress: number; // 0-100
  fileName?: string;
  fileSize?: number; // Bytes
  totalRows?: number;
  processedRows?: number;
  errors: ImportError[];
  warnings?: ImportWarning[];
  onRetry?: () => void;
  onCancel?: () => void;
  onDownloadErrors?: () => void; // Export error report as CSV
}

interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportWarning {
  row: number;
  field: string;
  message: string;
}
```

**Phase Visual** (horizontal mini-stepper, 5 phases):

| Phase    | Icon                     | Label    | Active When               |
| -------- | ------------------------ | -------- | ------------------------- |
| Upload   | CloudArrowUpIcon         | Upload   | `status === "uploading"`  |
| Validate | ShieldCheckIcon          | Validate | `status === "validating"` |
| Review   | ExclamationTriangleIcon  | Review   | `status === "error"`      |
| Import   | ArrowPathIcon (spinning) | Import   | `status === "importing"`  |
| Complete | CheckCircleIcon          | Done     | `status === "complete"`   |

**Progress Bar**: Full-width, 8px height, border-radius 4px. Track: `--bg-tertiary`. Fill: `--accent` (normal), `--error` (error state). Text above: "Processed N of M rows" (Caption, `--text-secondary`).

**Error Display**: Collapsible section below progress bar. Header: "N errors found" (Body, 600, `--error`) + expand chevron. Expanded: scrollable list (max-height 240px). Each error row: row number (monospace, Caption), field name (Caption, 600), error message (Caption, `--text-secondary`). "Download Error Report" ghost button at bottom.

**Idle State**: Dropzone area (dashed border, 120px height) with upload icon and "Drop CSV file or click to browse" text.

**Animation**: Progress bar fills smoothly (CSS transition, 300ms linear). Phase icons: active phase pulses subtly. Completion: checkmark draws in (AP: Section 9). Error shake on validation failure (AP: Section 7).

**Accessibility**

- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Import progress"`.
- Phase stepper: `role="list"`, each phase `role="listitem"` with `aria-current="step"`.
- Error list: `role="alert"` on appearance. Each error row readable by screen reader with full context.
- Cancel and retry buttons always keyboard accessible.
- Status changes announced via `aria-live="polite"` region.

---

### 9.9 VanityLogin

Branded login card supporting per-property customization. Properties can apply their logo, colors, and background image for a white-labeled sign-in experience.

```tsx
interface VanityLoginProps {
  propertyName: string;
  propertyLogo?: string; // URL to logo image
  primaryColor?: string; // OKLCH or hex override for CTA button
  backgroundImage?: string; // URL to full-bleed background
  loginMethod: 'email' | 'code'; // Email + password vs. magic code
  onSubmit: (credentials: LoginCredentials) => void;
  loading?: boolean;
  error?: string; // Inline error message
  onForgotPassword?: () => void;
}

interface LoginCredentials {
  email: string;
  password?: string; // Only for "email" method
  code?: string; // Only for "code" method
}
```

**Layout**: Full viewport. Optional `backgroundImage` fills the viewport with `object-fit: cover` and a dark overlay (rgba(0,0,0,0.5)) for contrast. Card centered vertically and horizontally. Card width: 420px (desktop), 100vw with 16px padding (mobile). Border-radius: 16px. Shadow: `--shadow-4`. Background: `--bg-primary`. Padding: 40px.

**Card Content (top to bottom)**:

1. Logo: property logo image (max-height 48px, auto width) or Concierge default logo. Centered. 24px bottom margin.
2. Property name: Title 2 (24px, 700), centered. 8px bottom margin.
3. Welcome text: "Sign in to your account" (Body, `--text-secondary`), centered. 32px bottom margin.
4. Email input: standard TextInput, full width. Label "Email address".
5. Password input (email method): TextInput with type="password" and show/hide toggle. Label "Password". OR Code input (code method): 6-digit code input with individual character boxes.
6. "Forgot password?" link (Caption, `--accent`), right-aligned. 24px top margin.
7. Submit button: full width, primary variant. Label "Sign In" (email) or "Verify Code" (code). Uses `primaryColor` override if provided.
8. Error message: below submit, `--error` color, Body text with ExclamationCircleIcon.

**Fallback**: When no `propertyLogo` or `primaryColor` provided, uses Concierge default branding (logo, `--accent` for buttons). No `backgroundImage` = solid `--bg-secondary` page background.

**Animation**: Card fades in + slides up 20px on mount (300ms, easeOut). Error message shakes horizontally (AP: Section 7). Loading state on submit button (spinner).

**Accessibility**

- Card: `role="main"`, `aria-label="Sign in to [propertyName]"`.
- Form: standard `<form>` element with `onSubmit` handler.
- Error message: `role="alert"`, `aria-live="assertive"`.
- Password visibility toggle: `aria-label="Show password"` / `"Hide password"`.
- All inputs have associated `<label>` elements.
- `Enter` key submits the form from any input.
- Autofocus on email input on mount.

---

### 9.10 WizardStep

Individual step container used within the OnboardingStepper (9.1). Provides a consistent layout for step content with navigation controls and validation feedback.

```tsx
interface WizardStepProps extends BaseInteractiveProps {
  title: string;
  description?: string;
  stepNumber: number;
  totalSteps: number;
  status: 'pending' | 'active' | 'complete' | 'skipped';
  children: React.ReactNode; // Step content (forms, selections, etc.)
  onNext: () => void;
  onBack?: () => void; // Hidden on first step
  onSkip?: () => void; // Only shown when provided
  isLastStep?: boolean; // Changes "Next" to "Go Live"
  nextLabel?: string; // Override "Next" button text
  loading?: boolean; // Disables buttons and shows spinner on Next
  errors?: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

**Layout**: Max-width 720px, centered horizontally. Top: step header. Middle: content area (children). Bottom: navigation footer.

**Step Header**: Step indicator "Step N of M" (Caption, `--text-tertiary`). Title (Title 2, 24px, 700). Description (Body, `--text-secondary`). Spacing: indicator to title 8px, title to description 4px, description to content 32px.

**Content Area**: Minimum height 200px. Children rendered directly. Padding: 0 (content provides its own padding).

**Validation Error Summary**: Rendered above the footer when `errors.length > 0`. Background: `--error-subtle`. Border-radius: 8px. Padding: 12px 16px. Icon: ExclamationTriangleIcon (16px, `--error`). Each error: field name (Caption, 600) + message (Caption, `--text-secondary`). Separator: divider between errors.

**Navigation Footer**: Border-top `--border-primary`. Padding-top: 24px. Margin-top: 32px. Layout: flex, space-between.

| Position     | Button                                  | Condition                                 |
| ------------ | --------------------------------------- | ----------------------------------------- |
| Left         | "Back" (secondary)                      | `onBack` provided and `stepNumber > 1`    |
| Center-right | "Skip" (ghost)                          | `onSkip` provided                         |
| Right        | "Next" (primary) or "Go Live" (primary) | Always shown. "Go Live" when `isLastStep` |

**Button Sizes**: All navigation buttons use `md` size. "Go Live" button uses `lg` size with celebration icon (RocketLaunchIcon).

**Loading State**: When `loading === true`, Next/Go Live button shows spinner and is disabled. Back and Skip buttons also disabled.

**Animation**: Content area fades in when step becomes active (200ms, easeOut). Error summary slides down from top of footer area (AP: Section 7). "Go Live" button has subtle pulse animation when step is valid and ready.

**Accessibility**

- Step container: `role="region"`, `aria-label="Step N: [title]"`.
- Error summary: `role="alert"`, `aria-live="assertive"`. Announced immediately on validation failure.
- Navigation buttons: descriptive `aria-label` including step context: "Go to next step: [next step title]".
- "Go Live" button: `aria-label="Complete setup and go live"`.
- Skip button: `aria-label="Skip [current step title]"`.
- Focus moves to first error field when validation fails (if errors reference form fields within children).
- Step transition: focus moves to step title on step change.

---

_Component count: 92 (12 Primitives + 15 Data Display + 10 Feedback + 10 Navigation + 9 Layout + 10 Forms + 10 Specialized + 6 Composite + 10 Business Operations)_

_Last updated: 2026-03-16_
_Design system version: v2_
_Animation reference: ANIMATION-PLAYBOOK.md_
_Breakpoint reference: RESPONSIVE-BREAKPOINTS.md_
