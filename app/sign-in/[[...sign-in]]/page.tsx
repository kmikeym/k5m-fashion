import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div
      className="relative z-10 flex justify-center max-w-3xl mx-auto w-full"
      style={{ padding: '40px var(--pad)' }}
    >
      <SignIn />
    </div>
  );
}
