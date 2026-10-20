import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function safeRedirect(value: string | null) {
  return value &&
    /^\/(?!\/)/.test(value) &&
    !value.includes('\\') &&
    !/^\/(login|signup)([/?#]|$)/.test(value)
    ? value
    : '/'
}
export function AuthPage({ signup = false }: { signup?: boolean }) {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (signup && data.get('password') !== data.get('confirm_password')) {
      setValidationError('Your passwords don’t match. Please try again.')
      return
    }
    if (
      signup &&
      (!String(data.get('first_name')).trim() || !String(data.get('last_name')).trim())
    ) {
      setValidationError('Please enter your first and last name.')
      return
    }
    setValidationError('')
    // Lesson 22 sends the form to the backend here.
    toast.info(
      signup
        ? 'Sign-up connects to the backend in Lesson 22.'
        : 'Sign-in connects to the backend in Lesson 22.',
    )
  }
  const otherLink = `/${signup ? 'login' : 'signup'}?redirect=${encodeURIComponent(redirect)}`
  return (
    <div className="page-content auth-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> Browse restaurants
      </Link>
      <section className="auth-card">
        <div className="auth-form-panel">
          <h1>{signup ? 'Create an account' : 'Sign in'}</h1>
          <p className="auth-subtitle">
            {signup
              ? 'Create an account to place orders.'
              : 'Sign in to manage your cart and place an order.'}
          </p>
          <form onSubmit={submit} className="auth-form">
            {signup ? (
              <>
                <div className="form-row">
                  <label htmlFor="first_name">
                    First name
                    <Input
                      id="first_name"
                      name="first_name"
                      autoComplete="given-name"
                      required
                      maxLength={80}
                      placeholder="Alex"
                    />
                  </label>
                  <label htmlFor="last_name">
                    Last name
                    <Input
                      id="last_name"
                      name="last_name"
                      autoComplete="family-name"
                      required
                      maxLength={80}
                      placeholder="Morgan"
                    />
                  </label>
                </div>
                <label htmlFor="email">
                  Email
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </label>
              </>
            ) : (
              <label htmlFor="username">
                Email or username
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  placeholder="you@example.com"
                />
              </label>
            )}
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  required
                  minLength={signup ? 8 : undefined}
                  placeholder={signup ? 'At least 8 characters' : 'Enter your password'}
                  aria-describedby={signup ? 'password-help' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {signup && (
              <>
                <p className="field-help" id="password-help">
                  Use at least 8 characters for your password.
                </p>
                <label htmlFor="confirm_password">
                  Confirm password
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Enter your password again"
                    aria-invalid={!!validationError}
                    aria-describedby={validationError ? 'auth-error' : undefined}
                  />
                </label>
              </>
            )}
            {validationError && (
              <p role="alert" className="form-error" id="auth-error">
                {validationError}
              </p>
            )}
            <Button size="lg" type="submit" className="w-full">
              {signup ? 'Create account' : 'Sign in'} <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Already have an account?' : 'New to QuickBite?'}{' '}
            <Link to={otherLink}>{signup ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
