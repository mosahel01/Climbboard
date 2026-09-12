import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { extractError } from '../services/api.js';

export default function Login() {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/dashboard';

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFormError('');
    try {
      const user = await login(form.email, form.password);
      success(`Welcome back, ${user.username}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(extractError(err));
      toastError('Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__logo">🏆</div>
          <h2>Welcome back</h2>
          <p className="auth-card__sub">Sign in to chase your best rank.</p>
        </div>
        {formError && <div className="auth-form-error">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <Input
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Button type="submit" variant="primary" size="lg" block loading={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="auth-card__foot">
          New to Climbboard? <Link to="/register">Create an account</Link>
        </p>
        <div className="demo-box">
          Demo account
          <br />
          email: <b>sahil@example.com</b>
          <br />
          password: <b>password123</b>
        </div>
      </div>
    </div>
  );
}