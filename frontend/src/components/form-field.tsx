import type { LucideIcon } from 'lucide-react';

interface FormFieldProps {
    autoComplete?: string;
    icon: LucideIcon;
    id: string;
    label: string;
    minLength?: number;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
    type?: string;
    value: string;
}

export default function FormField({
    autoComplete,
    icon: Icon,
    id,
    label,
    minLength,
    onChange,
    placeholder,
    required = true,
    type = 'text',
    value,
}: FormFieldProps) {
    return (
        <div className="grid gap-2">
            <label className="text-xs font-semibold text-stone-700" htmlFor={id}>
                {label}
            </label>
            <div className="relative">
                <Icon
                    aria-hidden="true"
                    className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400"
                    size={17}
                />
                <input
                    autoComplete={autoComplete}
                    className="h-12 w-full rounded-xl border border-stone-200 bg-white pr-4 pl-11 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    id={id}
                    minLength={minLength}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    required={required}
                    type={type}
                    value={value}
                />
            </div>
        </div>
    );
}
