"use client";

import { ReactNode } from "react";

export const fieldClass =
  "mt-2 w-full rounded-sm border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/10";

export const labelClass = "text-sm font-semibold text-zinc-800";

export function QuoteSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function FieldLabel({
  label,
  children,
  fullWidth = false,
  note,
  required = false,
}: {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
  note?: string;
  required?: boolean;
}) {
  return (
    <label className={fullWidth ? "sm:col-span-2" : ""}>
      <span className={labelClass}>
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      {children}
      {note ? <span className="mt-2 block text-sm text-zinc-600">{note}</span> : null}
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  note,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  note?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-sm border border-zinc-200 bg-zinc-50 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded-sm border-zinc-300 text-emerald-800 focus:ring-emerald-800"
      />
      <span>
        <span className={labelClass}>{label}</span>
        {note ? (
          <span className="mt-1 block text-sm leading-6 text-zinc-600">
            {note}
          </span>
        ) : null}
      </span>
    </label>
  );
}
