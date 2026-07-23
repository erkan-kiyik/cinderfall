import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="aurora-bg" aria-hidden />
      <p className="gradient-text relative text-7xl font-bold">404</p>
      <h1 className="relative mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Button variant="gradient" className="relative mt-8" asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
