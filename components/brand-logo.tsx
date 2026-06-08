import Image from "next/image";

export function BrandLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return <Image src="/argus-wordmark.png" alt="Argus" width={280} height={96} priority className={`${className} object-contain`} />;
}
