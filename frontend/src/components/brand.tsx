import { LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Brand({ light = false }: { light?: boolean }) {
    return (
        <Link
            className={`inline-flex w-fit items-center gap-3 font-semibold tracking-tight ${
                light ? 'text-white' : 'text-stone-900'
            }`}
            to="/"
        >
            <span
                className={`grid size-10 place-items-center rounded-xl ${
                    light
                        ? 'border border-white/20 bg-white/10'
                        : 'border border-emerald-100 bg-emerald-50 text-emerald-800'
                }`}
            >
                <LayoutGrid aria-hidden="true" size={19} />
            </span>
            <span className="text-xl">SiteShelf</span>
        </Link>
    );
}
