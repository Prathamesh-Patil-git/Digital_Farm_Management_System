import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthModal.css';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}


const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);


    // Simulate API call
    setTimeout(() => {
      if (mode === 'login') {
        if (email === 'admin@amu.gov' && password === 'admin123') {
          // ✅ SET AUTH TOKEN IN LOCALSTORAGE
          localStorage.setItem('amu_auth', 'ok');
          // ✅ NAVIGATE TO DASHBOARD
          navigate('/dashboard');
        } else {
          alert('Invalid credentials. Use admin@amu.gov / admin123');
          setIsLoading(false);
        }
      } else {
        // Register logic
        if (password === confirmPassword) {
          alert('Registration successful! Please login.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setIsLoading(false);
        } else {
          alert('Passwords do not match!');
          setIsLoading(false);
        }
      }
    }, 1500);
  };


  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
  };


  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };


  React.useEffect(() => {
    setMode(initialMode);
    resetForm();
  }, [initialMode, isOpen]);


  if (!isOpen) return null;


  return (
    <>
      {/* Overlay */}
      <div className="auth-overlay" onClick={onClose} />


      {/* Modal */}
      <div className="auth-modal">
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>


        {/* Header */}
        <div className="modal-header">
          <h2>Authority Portal</h2>
          <p>Antimicrobial Usage Monitoring System</p>
        </div>


        {/* Tab Buttons */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            disabled={isLoading}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
            disabled={isLoading}
          >
            Register
          </button>
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form" key={mode}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="fullname">Full Name</label>
              <input
                id="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>
          )}


          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'login' ? 'Enter your email' : 'Enter your email'}
              required
              disabled={isLoading}
            />
          </div>


          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>


          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            </div>
          )}


          <button type="submit" className="modal-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="modal-spinner"></span>
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>


        {/* Footer */}
        {mode === 'login' && (
          <div className="modal-footer">
            <a href="#forgot-password">Forgot Password?</a>
            <div className="modal-divider">•</div>
            <a href="#help">Need Help?</a>
          </div>
        )}
      </div>
    </>
  );
};


export default AuthModal;
