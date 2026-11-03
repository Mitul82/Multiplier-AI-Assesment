import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import AuthLayout from '../components/auth-layout';
import FeedbackMessage from '../components/feedback-message';
import FormField from '../components/form-field';
import { useAuth } from '../contexts/auth-context';
import { signIn, signUp } from '../lib/api';

export default function LoginPage() {
    const navigate = useNavigate();
    const { setSession } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = mode === 'signup'
                ? await signUp(name.trim(), email.trim(), password)
                : await signIn(email.trim(), password);

            setSession({
                token: response.access_token,
                user: response.user,
            });
            
            navigate('/library', { replace: true });
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Unable to authenticate. Please try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function toggleMode() {
        setMode((current) => current === 'signup' ? 'login' : 'signup');
        setError('');
    }

    return (
        <AuthLayout>
            <h2 className="mt-10 font-sans text-3xl font-bold tracking-tight text-stone-900">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 mb-8 text-sm text-stone-500">
                {mode === 'signup'
                    ? 'Start building your personal web library.'
                    : 'Sign in to pick up where you left off.'}
            </p>

            <form className="grid gap-5" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                    <FormField
                        autoComplete="name"
                        icon={UserRound}
                        id="full-name"
                        label="Full name"
                        onChange={setName}
                        placeholder="Your name"
                        value={name}
                    />
                )}
                <FormField
                    autoComplete="email"
                    icon={Mail}
                    id="email"
                    label="Email address"
                    onChange={setEmail}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                />
                <FormField
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    icon={LockKeyhole}
                    id="password"
                    label="Password"
                    minLength={mode === 'signup' ? 8 : undefined}
                    onChange={setPassword}
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                    type="password"
                    value={password}
                />
                {error && <FeedbackMessage>{error}</FeedbackMessage>}
                <button
                    className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
                    disabled={isSubmitting}
                    type="submit"
                >
                    {isSubmitting
                        ? 'Please wait…'
                        : mode === 'signup'
                            ? 'Create account'
                            : 'Sign in'}
                    {!isSubmitting && <ArrowRight aria-hidden="true" size={16} />}
                </button>
            </form>

            <p className="mt-6 text-center text-xs text-stone-500">
                {mode === 'signup' ? 'Already have an account?' : 'New to SiteShelf?'}{' '}
                <button
                    className="font-bold text-emerald-700 hover:text-emerald-900"
                    onClick={toggleMode}
                    type="button"
                >
                    {mode === 'signup' ? 'Sign in' : 'Create an account'}
                </button>
            </p>
        </AuthLayout>
    );
}
