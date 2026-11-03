import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  ExternalLink,
  Globe2,
  LayoutGrid,
  Link2,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  ApiError,
  getSavedUrls,
  saveUrl,
  signIn,
  signUp,
  type SavedUrl,
  type User,
} from '../lib/api';

export interface Session {
  token: string;
  user: User;
}

interface LoginPageProps {
  session: Session | null;
  onAuthenticated: (session: Session) => void;
  onSignOut: () => void;
}

const sampleUrl =
  'https://www.justdial.com/Hyderabad/Dr-Sarita-Rao-Tx-Hospitals-Near-Masjid-Uppal-Bus-Stand-Bharath-Nagar-Colony-Uppal/040PXX40-XX40-231215200040-Y2E1_BZDET';

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
    throw new Error('Enter a valid website URL beginning with http:// or https://.');
  }

  return parsed.href;
}

function Brand({ mobile = false }: { mobile?: boolean }) {
  return (
    <a className={`brand${mobile ? ' auth-mobile-brand' : ''}`} href="/">
      <span className="brand-mark">
        <LayoutGrid aria-hidden="true" />
      </span>
      <span>SiteShelf</span>
    </a>
  );
}

function LoginPage({ session, onAuthenticated, onSignOut }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [url, setUrl] = useState('');
  const [savedUrls, setSavedUrls] = useState<SavedUrl[]>([]);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [urlBusy, setUrlBusy] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (!session) {
      setSavedUrls([]);
      setDashboardError('');
      return;
    }

    let active = true;
    setUrlsLoading(true);
    setDashboardError('');

    getSavedUrls(session.token)
      .then((items) => {
        if (active) {
          setSavedUrls(items);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        if (error instanceof ApiError && error.status === 401) {
          onSignOut();
          return;
        }
        setDashboardError(
          error instanceof Error ? error.message : 'Unable to load saved websites.',
        );
      })
      .finally(() => {
        if (active) {
          setUrlsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [session?.token, onSignOut]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');
    setAuthBusy(true);

    try {
      const response =
        mode === 'signup'
          ? await signUp(name.trim(), email.trim(), password)
          : await signIn(email.trim(), password);
      onAuthenticated({
        token: response.access_token,
        user: response.user,
      });
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Unable to authenticate. Please try again.',
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSaveUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDashboardError('');

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : 'Enter a valid website URL.',
      );
      return;
    }

    if (!session) {
      return;
    }

    setUrlBusy(true);
    try {
      const saved = await saveUrl(normalizedUrl, session.token);
      setSavedUrls((current) => [saved, ...current]);
      setUrl('');
      toast.success('Website saved to your collection.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSignOut();
        return;
      }
      setDashboardError(
        error instanceof Error ? error.message : 'Unable to save this website.',
      );
    } finally {
      setUrlBusy(false);
    }
  }

  if (session) {
    const firstName = session.user.name.trim().split(/\s+/)[0] || 'there';

    return (
      <main className="dashboard">
        <header className="topbar">
          <Brand />
          <div className="user-menu">
            <span className="user-avatar" aria-hidden="true">
              {session.user.name.trim().charAt(0).toUpperCase()}
            </span>
            <span className="user-name">{session.user.name}</span>
            <button className="signout-button" onClick={onSignOut} type="button">
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-row">
            <div className="welcome-copy">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                YOUR PERSONAL WEB LIBRARY
              </span>
              <h1>Good to see you, {firstName}.</h1>
              <p>Save the websites you love and keep their previews close.</p>
            </div>
            <div className="saved-count">
              <strong>{savedUrls.length}</strong>
              {savedUrls.length === 1 ? 'website saved' : 'websites saved'}
            </div>
          </section>

          <section className="submit-panel" aria-labelledby="add-website-heading">
            <div className="panel-heading">
              <span className="panel-heading-icon">
                <Plus aria-hidden="true" />
              </span>
              <div>
                <h2 id="add-website-heading">Add a website</h2>
                <p>Paste a link to create a live preview in your collection.</p>
              </div>
            </div>
            <form className="url-form" onSubmit={handleSaveUrl}>
              <div className="url-input-wrap">
                <Link2 aria-hidden="true" className="input-icon" />
                <input
                  aria-label="Website URL"
                  autoComplete="url"
                  className="url-input"
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  required
                  type="text"
                  value={url}
                />
              </div>
              <button className="primary-button url-submit" disabled={urlBusy} type="submit">
                {urlBusy ? (
                  <>
                    <span className="loading-spinner" />
                    Saving…
                  </>
                ) : (
                  <>
                    Save website
                    <ArrowRight aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
            <p className="form-hint">
              Only public http and https websites are supported.{' '}
              <button
                className="text-button sample-link"
                onClick={() => setUrl(sampleUrl)}
                type="button"
              >
                Try the Justdial sample
              </button>
            </p>
            {dashboardError && (
              <p className="auth-error" role="alert">
                {dashboardError}
              </p>
            )}
          </section>

          <section aria-labelledby="saved-websites-heading">
            <div className="section-header">
              <h2 id="saved-websites-heading">Your websites</h2>
              <span>Saved just for you</span>
            </div>

            {urlsLoading ? (
              <p className="loading-state">Loading your saved websites…</p>
            ) : savedUrls.length > 0 ? (
              <div className="saved-grid">
                {savedUrls.map((item) => {
                  let host = item.preview_title;
                  try {
                    host = new URL(item.url).hostname.replace(/^www\./, '');
                  } catch {
                    host = item.preview_title;
                  }

                  return (
                    <article className="site-card" key={item.id}>
                      <div className="site-preview">
                        <div className="preview-toolbar" aria-hidden="true">
                          <span className="browser-dot" />
                          <span className="browser-dot" />
                          <span className="browser-dot" />
                          <span className="preview-address">{host}</span>
                        </div>
                        <iframe
                          className="site-iframe"
                          loading="lazy"
                          sandbox="allow-forms allow-popups allow-scripts"
                          src={item.preview_url}
                          title={`Preview of ${host}`}
                        />
                        <span className="preview-note">
                          Some websites block embedded previews
                        </span>
                      </div>
                      <div className="site-details">
                        <span className="site-favicon">
                          <Globe2 aria-hidden="true" />
                        </span>
                        <div className="site-meta">
                          <strong>{item.preview_title}</strong>
                          <a href={item.url} rel="noreferrer" target="_blank">
                            {item.url}
                          </a>
                        </div>
                        <a
                          aria-label={`Open ${host} in a new tab`}
                          className="open-site"
                          href={item.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink aria-hidden="true" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">
                  <BookmarkCheck aria-hidden="true" />
                </span>
                <h3>Your collection starts here</h3>
                <p>Add a website above and its preview will be waiting for you here.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <aside className="auth-aside">
        <Brand />
        <div className="aside-content">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            A BETTER WAY TO SAVE
          </span>
          <h1>
            Your web,
            <br />
            all in <span>one place.</span>
          </h1>
          <p>
            Keep the sites you love organized, easy to find, and ready to revisit
            with a glance.
          </p>
          <div className="aside-card">
            <span className="aside-card-icon">
              <Sparkles aria-hidden="true" />
            </span>
            <span>
              <strong>A little home for your favorite sites</strong>
              <small>Save a link. Keep the whole picture.</small>
            </span>
          </div>
        </div>
        <span className="aside-foot">A calmer corner of the internet.</span>
      </aside>

      <section className="auth-main">
        <div className="auth-card">
          <Brand mobile />
          <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-subtitle">
            {mode === 'signup'
              ? 'Start building your personal web library.'
              : 'Sign in to pick up where you left off.'}
          </p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="full-name">Full name</label>
                <div className="input-wrap">
                  <UserRound aria-hidden="true" className="input-icon" />
                  <input
                    autoComplete="name"
                    id="full-name"
                    maxLength={80}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                    value={name}
                  />
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email address</label>
              <div className="input-wrap">
                <Mail aria-hidden="true" className="input-icon" />
                <input
                  autoComplete="email"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <LockKeyhole aria-hidden="true" className="input-icon" />
                <input
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  id="password"
                  minLength={mode === 'signup' ? 8 : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  required
                  type="password"
                  value={password}
                />
              </div>
            </div>
            {authError && (
              <p className="auth-error" role="alert">
                {authError}
              </p>
            )}
            <button className="primary-button" disabled={authBusy} type="submit">
              {authBusy ? (
                <>
                  <span className="loading-spinner" />
                  Please wait…
                </>
              ) : (
                <>
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signup' ? 'Already have an account?' : 'New to SiteShelf?'}{' '}
            <button
              className="text-button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setAuthError('');
              }}
              type="button"
            >
              {mode === 'signup' ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;