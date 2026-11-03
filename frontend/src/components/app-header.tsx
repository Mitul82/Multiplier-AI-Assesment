import { LogOut } from 'lucide-react';

import { useAuth } from '../contexts/auth-context';
import Brand from './brand';

export default function AppHeader() {
    const { session, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-5 backdrop-blur sm:h-[72px] sm:px-8">
            <Brand />
            <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                    {session?.user.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-40 truncate text-xs text-stone-600 sm:inline">
                    {session?.user.name}
                </span>
                <button
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:border-emerald-200 hover:text-emerald-800"
                    onClick={signOut}
                    type="button"
                >
                    <LogOut aria-hidden="true" size={14} />
                    Sign out
                </button>
            </div>
        </header>
    );
}
