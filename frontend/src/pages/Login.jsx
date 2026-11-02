import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Lock, Mail, User } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register({
          full_name: fullName,
          email,
          password,
        });
      } else {
        await login({
          email,
          password,
        });
      }

      navigate('/', { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Wallet size={28} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Expense Tracker
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {isRegistering
              ? 'Create your personal finance account'
              : 'Sign in to manage your finances'}
          </p>

        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {isRegistering && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>

              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={19} />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={19} />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={19} />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : isRegistering
                ? 'Create Account'
                : 'Sign In'}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-slate-600">

          {isRegistering
            ? 'Already have an account?'
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="ml-2 font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>

        </div>

      </div>
    </div>
  );
}

export default Login;