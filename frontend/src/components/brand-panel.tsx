import { Sparkles } from 'lucide-react';

import Brand from './brand';

export default function BrandPanel() {
    return (
        <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_68%_46%,rgba(108,167,107,0.3),transparent_38%),linear-gradient(145deg,#173b2c_4%,#123627_54%,#0d2b20_100%)] px-12 py-9 text-white md:flex xl:px-20">
            <div className="pointer-events-none absolute -bottom-36 -right-36 size-[430px] rounded-full border border-white/10 before:absolute before:inset-16 before:rounded-full before:border before:border-white/10" />
            <Brand light />
            <div className="relative my-auto max-w-lg py-20">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-emerald-200 uppercase">
                    <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_14px_#92d4a9]" />
                    A better way to save
                </span>
                <h1 className="mt-6 font-sans text-5xl leading-[1.08] font-semibold tracking-tight xl:text-6xl">
                    Your web,
                    <br />
                    all in <span className="text-emerald-200">one place.</span>
                </h1>
                <p className="mt-5 max-w-sm text-base leading-7 text-emerald-50/75">
                    Keep the sites you love organized, easy to find, and ready to revisit with a glance.
                </p>
                <div className="mt-10 flex w-fit items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <span className="grid size-10 place-items-center rounded-xl bg-emerald-200 text-emerald-950">
                        <Sparkles aria-hidden="true" size={19} />
                    </span>
                    <span>
                        <strong className="block text-sm">A little home for your favorite sites</strong>
                        <small className="mt-1 block text-xs text-emerald-50/70">
                            Save a link. Keep the whole picture.
                        </small>
                    </span>
                </div>
            </div>
            <span className="relative text-xs text-emerald-50/65">
                A calmer corner of the internet.
            </span>
        </aside>
    );
}
