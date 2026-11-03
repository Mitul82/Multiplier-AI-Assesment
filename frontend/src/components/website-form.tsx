import { ArrowRight, Link2, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';

import { ApiError, saveUrl } from '../lib/api';
import FeedbackMessage from './feedback-message';

interface WebsiteFormProps {
    onSaved: (item: Awaited<ReturnType<typeof saveUrl>>) => void;
    onUnauthorized: () => void;
}

function normalizeUrl(value: string): string {
    const trimmed = value.trim();
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
    const parsed = new URL(candidate);

    if (
        !['http:', 'https:'].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username ||
        parsed.password
    ) {
        throw new Error('Enter a public website URL using http:// or https://.');
    }

    return parsed.href;
}

export default function WebsiteForm({ onSaved, onUnauthorized }: WebsiteFormProps) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        let normalizedUrl: string;
        try {
            normalizedUrl = normalizeUrl(url);
        } catch (validationError) {
            setError(
                validationError instanceof Error
                    ? validationError.message
                    : 'Enter a valid website URL.',
            );
            return;
        }

        setIsSaving(true);
        try {
            const item = await saveUrl(normalizedUrl);
            onSaved(item);
            setUrl('');
            toast.success('Website saved to your collection.');
        } catch (requestError) {
            if (requestError instanceof ApiError && requestError.status === 401) {
                onUnauthorized();
                return;
            }
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to save this website.',
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-emerald-950/[0.03] sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Plus aria-hidden="true" size={19} />
                </span>
                <div>
                    <h2 className="text-sm font-bold text-stone-800">Add a website</h2>
                    <p className="mt-1 text-xs text-stone-500">
                        Paste a link to create a live preview in your collection.
                    </p>
                </div>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
                <div className="relative">
                    <Link2
                        aria-hidden="true"
                        className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400"
                        size={17}
                    />
                    <input
                        aria-label="Website URL"
                        autoComplete="url"
                        className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50/60 pr-4 pl-11 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://example.com"
                        required
                        type="text"
                        value={url}
                    />
                </div>
                <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
                    disabled={isSaving}
                    type="submit"
                >
                    {isSaving ? 'Saving…' : 'Save website'}
                    {!isSaving && <ArrowRight aria-hidden="true" size={16} />}
                </button>
            </form>
            <p className="mt-3 text-[11px] text-stone-500">
                Public http and https websites only.{' '}
            </p>
            {error && (
                <div className="mt-4">
                    <FeedbackMessage>{error}</FeedbackMessage>
                </div>
            )}
        </section>
    );
}
