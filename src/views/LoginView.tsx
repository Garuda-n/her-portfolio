import React, { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { signIn } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const result = await signIn(email.trim(), password.trim());
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="login-view-container">
      <div className="login-glass-card">
        <div className="login-card-header">
          <span className="login-subtitle">SECURE ACCESS</span>
          <h2 className="login-title">FORHER STUDIO</h2>
          <p className="login-lead">Please sign in to access the Creative Console.</p>
        </div>

        {errorMsg && (
          <div className="login-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="login-form">
          {/* Email input */}
          <div className="login-form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@forher.com"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password input with show/hide toggle */}
          <div className="login-form-group">
            <label htmlFor="login-password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button 
            type="submit" 
            className="btn btn-primary btn-login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-spinner-container">
                <span className="login-spinner"></span>
                <span>Verifying...</span>
              </span>
            ) : (
              'Access Console'
            )}
          </button>
        </form>

        <div className="login-card-footer">
          <a href="#/" className="btn-back-home">&larr; Return to Portfolio</a>
        </div>
      </div>
    </div>
  );
};
