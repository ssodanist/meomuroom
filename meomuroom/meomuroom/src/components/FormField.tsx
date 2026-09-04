import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-lg font-bold text-ink-900">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border-2 border-moss-200 bg-white px-4 text-lg text-ink-900 outline-none focus:border-moss-500 ${
        props.className ?? ''
      }`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border-2 border-moss-200 bg-white p-4 text-lg leading-relaxed text-ink-900 outline-none focus:border-moss-500 ${
        props.className ?? ''
      }`}
    />
  );
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border-2 border-moss-200 bg-white px-4 text-lg text-ink-900 outline-none focus:border-moss-500 ${
        props.className ?? ''
      }`}
    >
      {children}
    </select>
  );
}
