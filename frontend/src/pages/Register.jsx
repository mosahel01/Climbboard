import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { extractError } from '../services/api.js';

export default function Register() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
      next.username = 'Use 3-20 letters, numbers or underscores.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 6) next.password = 'Use at least 6 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setFormError('');
    try {
      const user = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      success(`Welcome aboard, ${user.username}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(extractError(err));
      toastError('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__logo">🚀</div>
          <h2>Create your account</h2>
          <p className="auth-card__sub">Join the leaderboard and start your first run.</p>
        </div>
        {formError && <div className="auth-form-error">{formError}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <Input
            label="Username"
            id="username"
            autoComplete="username"
            placeholder="PixelChampion"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            error={errors.username}
          />
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
            autoComplete="new-password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Input
            label="Confirm password"
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            error={errors.confirm}
          />
          <Button type="submit" variant="primary" size="lg" block loading={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="auth-card__foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}