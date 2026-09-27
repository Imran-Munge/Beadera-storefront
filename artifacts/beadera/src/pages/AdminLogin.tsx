import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { useAdminLogin, getGetAdminSessionQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import logo from '@assets/beadera-logo.png';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useAdminLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ data: { email, password } }, { onSuccess: (session) => { queryClient.setQueryData(getGetAdminSessionQueryKey(), session); setLocation('/admin'); } });
  };
  return (
    <main className="paper-grain flex min-h-[100dvh] items-center justify-center bg-[#fff8ef] px-5 py-10 text-[#5e1b2f]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#f3d9d8] shadow-[0_24px_80px_rgba(94,27,47,.15)] md:grid-cols-2">
        <div className="relative hidden min-h-[600px] flex-col justify-between overflow-hidden p-12 md:flex"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-[#d9a35d]/40" /><div><Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#762338]" data-testid="link-login-home"><ArrowLeft size={14} /> back to Beadera</Link><img src={logo} alt="Beadera" className="mt-20 h-24 w-48 rounded-xl object-cover object-center mix-blend-multiply" /></div><div><p className="serif max-w-sm text-4xl leading-tight text-[#762338]">The little things are in good hands.</p><p className="mt-5 max-w-xs text-sm leading-6 text-[#795761]">Manage your collection, your workshops and the stories waiting to be made.</p></div></div>
        <div className="flex min-h-[600px] flex-col justify-center bg-[#fff8ef] p-7 sm:p-12"><Link href="/" className="mb-12 inline-flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-[.16em] text-[#762338] md:hidden" data-testid="link-mobile-login-home"><ArrowLeft size={14} /> Beadera</Link><div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3d9d8] text-[#762338]"><LockKeyhole size={20} /></div><span className="mono text-[10px] uppercase tracking-[.25em] text-[#b36b37]">studio access</span><h1 className="serif mt-3 text-4xl text-[#5e1b2f]">Welcome back.</h1><p className="mt-3 text-sm leading-6 text-[#8a6771]">Sign in to look after the Beadera table.</p><form onSubmit={submit} className="mt-9 space-y-6" data-testid="form-admin-login"><label className="block text-xs font-semibold text-[#795761]">email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-3 text-sm outline-none focus:border-[#762338]" data-testid="input-admin-email" /></label><label className="block text-xs font-semibold text-[#795761]">password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="mt-2 w-full border-b border-[#dec5c5] bg-transparent py-3 text-sm outline-none focus:border-[#762338]" data-testid="input-admin-password" /></label>{login.isError && <p className="rounded-lg bg-[#fff0eb] p-3 text-xs text-[#a53d48]" data-testid="status-login-error">That sign-in did not work. Check your details and try again.</p>}<button type="submit" disabled={login.isPending} className="flex w-full items-center justify-center gap-3 rounded-full bg-[#762338] px-6 py-4 text-xs font-semibold uppercase tracking-[.2em] text-[#fff8ef] transition hover:bg-[#5e1b2f] disabled:opacity-60" data-testid="button-admin-submit">{login.isPending ? 'opening studio...' : 'enter studio'}<ArrowRight size={16} /></button></form></div>
      </div>
    </main>
  );
}