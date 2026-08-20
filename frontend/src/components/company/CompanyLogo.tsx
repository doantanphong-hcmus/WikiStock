import Image from "next/image";

const companyLogos: Record<string, string> = {
  FPT: "/images/company-logos/FPT.png",
  GAS: "/images/company-logos/GAS.png",
  HPG: "/images/company-logos/HPG.png",
  HSG: "/images/company-logos/HSG.png",
  MWG: "/images/company-logos/MWG.jpg",
  SSI: "/images/company-logos/SSI.png",
  VCB: "/images/company-logos/VCB.png",
  VCG: "/images/company-logos/VCG.png",
  VIC: "/images/company-logos/VIC.jpg",
  VNM: "/images/company-logos/VNM.png",
};

export function CompanyLogo({
  ticker,
  companyName,
  className = "h-16 w-20",
}: {
  ticker: string;
  companyName: string;
  className?: string;
}) {
  const logoSrc = companyLogos[ticker];

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm ${className}`}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={`Logo chính thức của ${companyName}`}
          fill
          sizes="80px"
          className="object-contain p-1.5"
        />
      ) : (
        <span className="text-base font-bold tracking-wide text-emerald-800">
          {ticker}
        </span>
      )}
    </span>
  );
}
