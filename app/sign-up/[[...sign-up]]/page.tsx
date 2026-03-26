import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div
      className="relative z-10 flex justify-center max-w-3xl mx-auto w-full"
      style={{ padding: '40px var(--pad)' }}
    >
      <SignUp />
    </div>
  );
}
