// app/(protected)/god/layout.tsx
import GodModeGuard from '@/components/auth/GodModeGuard';

export default function GodLayout({ children }: { children: React.ReactNode }) {
  return <GodModeGuard>{children}</GodModeGuard>;
}