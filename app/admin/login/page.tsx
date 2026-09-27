import type { Metadata } from 'next';
import '../admin.css';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <div className="login">
      <div className="bg" />
      <div className="veil" />
      <LoginForm />
    </div>
  );
}
