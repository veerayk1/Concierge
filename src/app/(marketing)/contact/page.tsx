'use client';

import { useState, type FormEvent } from 'react';
import type { Metadata } from 'next';

// ---------------------------------------------------------------------------
// Note: metadata export is not allowed in client components. We export it
// from a separate file or handle it in the layout. For now, the page title
// is set via the marketing layout.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-8 text-center md:pt-28">
        <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900 md:text-[48px]">
          Get in touch
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-relaxed text-neutral-600">
          Have a question, want a demo, or ready to get started? We would love to hear from you.
        </p>
      </section>

      {/* Contact form */}
      <section className="mx-auto max-w-xl px-6 pt-8 pb-20">
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

          {/* Message */}
          <div className="flex flex-col gap-2">
            <label htmlFor="contact-message" className="text-[14px] font-medium text-neutral-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
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
      </section>
    </div>
  );
}
