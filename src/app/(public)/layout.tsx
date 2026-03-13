import { BackToTopButton } from '@/modules/landing/components/BackToTopButton';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BackToTopButton />
    </>
  );
}