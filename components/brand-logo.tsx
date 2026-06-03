import Image from "next/image";

export function BrandLogo({ className = "h-8 w-8 rounded-md" }: { className?: string }) {
  return <Image src="/argus-logo.png" alt="Argus" width={64} height={64} priority className={`${className} object-cover`} />;
}
