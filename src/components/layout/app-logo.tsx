import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
      <GraduationCap className="h-6 w-6 text-sidebar-primary" />
      <span>EduBoost</span>
    </Link>
  );
}
