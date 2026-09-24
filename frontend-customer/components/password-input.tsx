"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
  className?: string;
}

/**
 * Input password dengan tombol mata untuk show/hide.
 * Dipakai di form daftar, login, dan atur password.
 */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  required,
  minLength,
  id,
  className,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className={
          className ??
          "w-full rounded-lg border bg-background px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        }
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Sembunyikan password" : "Lihat password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
