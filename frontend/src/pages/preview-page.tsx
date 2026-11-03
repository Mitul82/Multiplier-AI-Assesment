import { BookmarkCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import AppHeader from '../components/app-header';
import FeedbackMessage from '../components/feedback-message';
import SiteCard from '../components/site-card';
import WebsiteForm from '../components/website-form';
import { useAuth } from '../contexts/auth-context';
import { ApiError, getSavedUrls, type SavedUrl } from '../lib/api';

export default function PreviewPage() {
    const { session, signOut } = useAuth();
    const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isActive = true;
        setIsLoading(true);
        setError('');

        getSavedUrls()
            .then((items) => {
                if (isActive) {
                    setSavedUrls(items);
                }
            })
            .catch((requestError: unknown) => {
                if (!isActive) {
                    return;
                }
                if (requestError instanceof ApiError && requestError.status === 401) {
                    signOut();
                    return;
                }
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : 'Unable to load your saved websites.',
                );
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [session?.token, signOut]);

    function handleUnauthorized() {
        signOut();
    }

    const firstName = session?.user.name.trim().split(/\s+/)[0] || 'there';

    return (
        <main className="min-h-screen bg-stone-50">
            <AppHeader />
            <div className="mx-auto w-[min(100%-2rem,70rem)] py-9 sm:w-[min(100%-3rem,70rem)] sm:py-12">
                <section className="mb-8 flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.13em] text-emerald-700 uppercase">
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                            Your personal web library
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                            Good to see you, {firstName}.
                        </h1>
                        <p className="mt-2 text-sm text-stone-500">
                            Save the websites you love and keep their previews close.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs text-stone-500">
                        <strong className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
                            {savedUrls.length}
                        </strong>
                        {savedUrls.length === 1 ? 'website saved' : 'websites saved'}
                    </div>
                </section>

                <WebsiteForm
                    onSaved={(item) => setSavedUrls((current) => [item, ...current])}
                    onUnauthorized={handleUnauthorized}
                />

                <section className="mt-10" aria-labelledby="saved-websites-heading">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold tracking-tight text-stone-800" id="saved-websites-heading">
                            Your websites
                        </h2>
                        <span className="text-[11px] text-stone-500">Saved just for you</span>
                    </div>

                    {error && <FeedbackMessage>{error}</FeedbackMessage>}
                    {isLoading ? (
                        <p className="py-10 text-center text-sm text-stone-500">
                            Loading your saved websites…
                        </p>
                    ) : savedUrls.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {savedUrls.map((item) => (
                                <SiteCard item={item} key={item.id} />
                            ))}
                        </div>
                    ) : !error ? (
                        <div className="grid min-h-56 justify-items-center content-center rounded-2xl border border-dashed border-stone-300 bg-white/70 p-6 text-center">
                            <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <BookmarkCheck aria-hidden="true" size={20} />
                            </span>
                            <h3 className="mt-4 text-sm font-bold text-stone-800">
                                Your collection starts here
                            </h3>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-stone-500">
                                Add a website above and its preview will be waiting for you here.
                            </p>
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
