'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SUBJECTS = [
  { value: '', label: 'Select a subject' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'sales', label: 'Sales & Pricing' },
  { value: 'support', label: 'Technical Support' },
  { value: 'security', label: 'Security & Privacy' },
] as const;

const CONTACT_INFO = [
  {
    label: 'Email',
    value: 'hello@concierge.com',
    href: 'mailto:hello@concierge.com',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 4l-10 8L2 4" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: 'Coming soon',
    href: null,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    label: 'Address',
    value: 'Toronto, Ontario, Canada',
    href: null,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
] as const;

const OFFICE_HOURS = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM ET' },
  { day: 'Saturday', hours: '10:00 AM - 2:00 PM ET' },
  { day: 'Sunday', hours: 'Closed' },
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!subject) {
      newErrors.subject = 'Please select a subject';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
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
          <h2 className="mt-4 text-[24px] font-bold text-neutral-900">Thank you!</h2>
          <p className="mt-2 text-[16px] text-neutral-600">
            We have received your message and will get back to you within one business day.
          </p>
          <Link
            href={'/' as never}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-5 text-[14px] font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-8 text-center md:pt-28">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Contact Us
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          Have a question, want a demo, or ready to get started? We would love to hear from you.
        </p>
      </section>

      {/* Form + Sidebar */}
      <section className="mx-auto max-w-5xl px-6 pt-8 pb-20 md:pb-28">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Contact Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-name" className="text-[14px] font-medium text-neutral-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label htmlFor="contact-email" className="text-[14px] font-medium text-neutral-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="you@company.com"
                />
                {errors.email && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-subject"
                  className="text-[14px] font-medium text-neutral-700"
                >
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-[44px] w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value} disabled={s.value === ''}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-message"
                  className="text-[14px] font-medium text-neutral-700"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 focus:outline-none"
                  placeholder="Tell us about your property and what you are looking for..."
                />
                {errors.message && (
                  <p className="text-[13px] font-medium text-red-600" role="alert">
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-neutral-900 text-[15px] font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            {/* Contact Info */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900">Contact Information</h3>
              <div className="mt-5 flex flex-col gap-5">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 text-neutral-400">{item.icon}</div>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-400">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-[14px] font-medium text-neutral-900 underline underline-offset-2 transition-colors hover:text-neutral-700"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-[14px] text-neutral-700">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Hours */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900">Office Hours</h3>
              <div className="mt-4 flex flex-col gap-3">
                {OFFICE_HOURS.map((item) => (
                  <div key={item.day} className="flex items-center justify-between">
                    <p className="text-[14px] text-neutral-600">{item.day}</p>
                    <p className="text-[14px] font-medium text-neutral-900">{item.hours}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
              <h3 className="text-[16px] font-semibold text-neutral-900">Quick Links</h3>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={'/demo' as never}
                  className="text-[14px] font-medium text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-900"
                >
                  Request a Demo
                </Link>
                <Link
                  href={'/pricing' as never}
                  className="text-[14px] font-medium text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-900"
                >
                  View Pricing
                </Link>
                <Link
                  href={'/security-privacy' as never}
                  className="text-[14px] font-medium text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-900"
                >
                  Security & Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
