import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import type { Session, User } from '../lib/api';

interface AuthContextValue {
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setSession: (session: Session) => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isUser(value: unknown): value is User {
    return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        'email' in value &&
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.email === 'string'
    );
}

function readSession(): Session | null {
    const token = window.localStorage.getItem('accessToken');
    const savedUser = window.localStorage.getItem('currentUser');

    if (!token || !savedUser) {
        return null;
    }

    try {
        const user: unknown = JSON.parse(savedUser);
        if (isUser(user)) {
            return { token, user };
        }
    } catch {
        window.localStorage.removeItem('currentUser');
        window.localStorage.removeItem('accessToken');
        return null;
    }

    window.localStorage.removeItem('currentUser');
    window.localStorage.removeItem('accessToken');
    return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, updateSession] = useState<Session | null>(readSession);

    const setSession = useCallback((nextSession: Session) => {
        window.localStorage.setItem('accessToken', nextSession.token);
        window.localStorage.setItem('currentUser', JSON.stringify(nextSession.user));
        updateSession(nextSession);
    }, []);

    const signOut = useCallback(() => {
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('currentUser');
        updateSession(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            isAuthenticated: session !== null,
            isLoading: false,
            setSession,
            signOut,
        }),
        [session, setSession, signOut],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider.');
    }
    return context;
}
