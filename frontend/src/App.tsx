import { useCallback, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/login-page';
import type { Session } from './pages/login-page';
import type { User } from './lib/api';

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
  }

  window.localStorage.removeItem('currentUser');
  window.localStorage.removeItem('accessToken');
  return null;
}

function App() {
  const [session, setSession] = useState<Session | null>(readSession);

  const handleSignOut = useCallback(() => {
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('currentUser');
    setSession(null);
  }, []);

  const handleAuthenticated = useCallback((nextSession: Session) => {
    window.localStorage.setItem('accessToken', nextSession.token);
    window.localStorage.setItem('currentUser', JSON.stringify(nextSession.user));
    setSession(nextSession);
  }, []);

  return (
    <>
      <Toaster position="bottom-right" />
      <LoginPage
        session={session}
        onAuthenticated={handleAuthenticated}
        onSignOut={handleSignOut}
      />
    </>
  );
}

export default App;
