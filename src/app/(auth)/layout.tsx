import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Ridge } from "@/components/shared/ridge";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        {children}
      </div>

      {/* ridge footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 opacity-80">
        <Ridge className="h-full" />
      </div>
    </div>
  );
}
