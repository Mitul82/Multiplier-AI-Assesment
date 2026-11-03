import type { ReactNode } from 'react';

import Brand from './brand';
import BrandPanel from './brand-panel';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <main className="grid min-h-screen bg-white md:grid-cols-2">
            <BrandPanel />
            <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
                <div className="w-full max-w-[410px]">
                    <Brand />
                    {children}
                </div>
            </section>
        </main>
    );
}
