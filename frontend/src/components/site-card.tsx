import { ExternalLink, Globe2 } from 'lucide-react';

import type { SavedUrl } from '../lib/api';

export default function SiteCard({ item }: { item: SavedUrl }) {
    let host = item.preview_title;
    try {
        host = new URL(item.url).hostname.replace(/^www\./, '');
    } catch {
        host = item.preview_title;
    }

    return (
        <article className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-emerald-950/[0.03]">
            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-50 via-stone-50 to-emerald-50">
                <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center gap-1.5 border-b border-stone-200/80 bg-white/95 px-3">
                    <span className="size-1.5 rounded-full bg-stone-300" />
                    <span className="size-1.5 rounded-full bg-stone-300" />
                    <span className="size-1.5 rounded-full bg-stone-300" />
                    <span className="mx-auto max-w-[65%] truncate rounded-md bg-stone-100 px-3 py-1 text-[10px] text-stone-500">
                        {host}
                    </span>
                </div>
                <iframe
                    className="absolute top-9 h-[calc(100%-2.25rem)] w-full border-0 bg-white"
                    loading="lazy"
                    sandbox="allow-forms allow-popups allow-scripts"
                    src={item.preview_url}
                    title={`Preview of ${host}`}
                />
                <span className="absolute right-2 bottom-2 z-10 rounded-md border border-stone-200 bg-white/95 px-2 py-1 text-[9px] text-stone-600">
                    Some sites block embedded previews
                </span>
            </div>
            <div className="flex min-w-0 items-center gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-emerald-700">
                    <Globe2 aria-hidden="true" size={17} />
                </span>
                <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-semibold text-stone-800">
                        {item.preview_title}
                    </strong>
                    <a
                        className="mt-1 block truncate text-[10px] text-stone-500 hover:text-emerald-700"
                        href={item.url}
                        rel="noreferrer"
                        target="_blank"
                    >
                        {item.url}
                    </a>
                </div>
                <a
                    aria-label={`Open ${host} in a new tab`}
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-stone-200 text-stone-500 hover:border-emerald-200 hover:text-emerald-700"
                    href={item.url}
                    rel="noreferrer"
                    target="_blank"
                >
                    <ExternalLink aria-hidden="true" size={14} />
                </a>
            </div>
        </article>
    );
}
