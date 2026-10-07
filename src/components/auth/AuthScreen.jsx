import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Eye, EyeOff, MessageSquare, Sparkles, User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';

export function AuthScreen() {
  const { login, register, switchUser, availableUsers, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('Felix');

  const avatarSeeds = ['Felix', 'Sarah', 'Alex', 'Priya', 'Maya', 'Jordan', 'Sam', 'Taylor'];

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      await loginWithGoogle();
      setSuccess('Successfully signed in with Google!');
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLogin) {
      if (!email || !password) {
        setError('Please fill in both email and password');
        return;
      }
      try {
        setLoading(true);
        await login(email, password);
      } catch (err) {
        setError(err.message || 'Invalid credentials');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !username || !email || !password) {
        setError('All fields are required');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      try {
        setLoading(true);
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAvatarSeed}&backgroundColor=b6e3f4`;
        await register({
          name,
          username,
          email,
          password,
          avatar,
          bio: 'Hey there! I am using ChatX ⚡'
        });
        setSuccess('Account created successfully! Redirecting...');
      } catch (err) {
        setError(err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickDemoLogin = (user) => {
    switchUser(user);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans">
      {/* Left / Top Brand Showcase Banner */}
      <div className="md:w-5/12 lg:w-1/2 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 border-b md:border-b-0 md:border-r border-slate-800">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Lockup */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950">
              <MessageSquare className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">ChatX</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Firebase Auth & Firestore</span>
            </div>
          </div>

          <div className="mt-12 md:mt-20">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Instant conversations. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Cloud synchronized.
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm md:text-base max-w-md leading-relaxed">
              Experience seamless real-time messaging, Google Firebase Authentication, Firestore cloud persistence, crisp voice & video calls, and temporary stories.
            </p>
          </div>
        </div>

        {/* Quick Demo Test Switcher */}
        <div className="mt-8 relative z-10 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Instant Demo Access (1-Click)
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Quick Switch
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'user_raju', name: 'Raju Sharma', role: 'Fullstack Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raju&backgroundColor=b6e3f4' },
              { id: 'user_sarah', name: 'Sarah Chen', role: 'UI/UX Designer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc' },
              { id: 'user_alex', name: 'Alex Rivera', role: 'Backend Lead', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9' }
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickDemoLogin(u)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all text-left group"
              >
                <Avatar src={u.avatar} name={u.name} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 truncate">
                    {u.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{u.role}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right / Bottom Auth Form */}
      <div className="md:w-7/12 lg:w-1/2 p-6 md:p-12 lg:p-16 flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isLogin ? 'Welcome back to ChatX' : 'Create your ChatX account'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Sign in with your Google account or credentials to access your chats.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Google Sign-In with Firebase Auth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-md flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50 mb-5"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-xs text-slate-500 uppercase tracking-wider shrink-0">
              Or sign in with email
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Form Tabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isLogin
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Raju Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">@</span>
                    <input
                      type="text"
                      placeholder="raju_sharma"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Avatar Style
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto py-1.5">
                    {avatarSeeds.map(seed => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => setSelectedAvatarSeed(seed)}
                        className={`p-1 rounded-full ring-2 transition-all ${
                          selectedAvatarSeed === seed ? 'ring-emerald-400 scale-105' : 'ring-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Avatar
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4`}
                          name={seed}
                          size="sm"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  placeholder={isLogin ? 'raju@chatx.io' : 'name@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('raju@chatx.io');
                      setPassword('password123');
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Auto-fill demo credentials
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to ChatX' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secured with Firebase Auth & Cloud Firestore</span>
          </div>
        </div>
      </div>
    </div>
  );
}
