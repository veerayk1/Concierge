'use client';

import { useState, type FormEvent } from 'react';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    title: 'Personalized Walkthrough',
    description:
      'See exactly how Concierge works for your type of property, with features tailored to your team size and workflow.',
  },
  {
    title: 'See Your Data in Action',
    description:
      'We can set up a sandbox with sample data matching your building so you can experience the platform firsthand.',
  },
  {
    title: 'No Commitment Required',
    description:
      'The demo is completely free with no obligation. Ask questions, explore features, and decide on your own timeline.',
  },
  {
    title: 'Expert Guidance',
    description:
      'Our team will walk you through migration from your current tools, onboarding timelines, and pricing options.',
  },
] as const;

const PROPERTY_TYPES = [
  'Condo Corporation',
  'Rental Apartment',
  'HOA / Strata',
  'Co-op',
  'Mixed-Use',
  'Commercial',
  'Other',
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    units: '',
    propertyType: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
        <div className="rounded-xl border border-neutral-200 bg-white p-8">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-neutral-900"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <h2 className="mt-4 text-[24px] font-bold text-neutral-900">Demo request received</h2>
          <p className="mt-2 text-[16px] text-neutral-600">
            Thank you, {formData.name}. A member of our team will reach out within one business day
            to schedule your personalized demo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-8 text-center md:pt-28">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Request a Demo
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          See how Concierge can modernize your building management. Get a personalized walkthrough
          tailored to your property.
        </p>
      </section>

      {/* Form + Benefits */}
      <section className="mx-auto max-w-7xl px-6 pt-8 pb-20 md:pb-28">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Form */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="demo-name" className="text-[14px] font-medium text-neutral-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="demo-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="demo-email" className="text-[14px] font-medium text-neutral-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="you@company.com"
                />
                {errors.email && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label htmlFor="demo-phone" className="text-[14px] font-medium text-neutral-700">
                  Phone
                </label>
                <input
                  id="demo-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="(416) 555-0100"
                />
              </div>

              {/* Company Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="demo-company" className="text-[14px] font-medium text-neutral-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="demo-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="Your management company or condo corporation"
                />
                {errors.company && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.company}
                  </p>
                )}
              </div>

              {/* Number of Units */}
              <div className="flex flex-col gap-2">
                <label htmlFor="demo-units" className="text-[14px] font-medium text-neutral-700">
                  Number of Units
                </label>
                <input
                  id="demo-units"
                  type="text"
                  value={formData.units}
                  onChange={(e) => handleChange('units', e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="e.g. 150"
                />
              </div>

              {/* Property Type */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="demo-property-type"
                  className="text-[14px] font-medium text-neutral-700"
                >
                  Property Type
                </label>
                <select
                  id="demo-property-type"
                  value={formData.propertyType}
                  onChange={(e) => handleChange('propertyType', e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                >
                  <option value="">Select a property type</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label htmlFor="demo-message" className="text-[14px] font-medium text-neutral-700">
                  Message
                </label>
                <textarea
                  id="demo-message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="Tell us about your building and what you are looking for..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Request a Demo
              </button>
            </form>
          </div>

          {/* Benefits sidebar */}
          <div className="md:col-span-2">
            <div className="sticky top-24 flex flex-col gap-6">
              <h2 className="text-[20px] font-semibold text-neutral-900">What to expect</h2>
              {BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-neutral-900"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-neutral-900">{benefit.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
