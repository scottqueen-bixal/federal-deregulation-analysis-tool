'use client';

export default function AnalysisHeader() {
  return (
    <header className="mb-12">
      <h1 className="pt-8 font-display text-5xl font-bold mb-4 text-foreground tracking-tight">
        Federal Deregulation Analysis
      </h1>
      <p className="text-xl text-muted-foreground font-light max-w-4xl">
        Comprehensive regulatory analysis and cross-cutting impact assessment for federal agencies
      </p>
      <div className="mb-8 pt-6 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Code of Federal Regulations (CFR) is the official legal print publication containing the codification of the general and permanent rules published in the Federal Register by the departments and agencies of the Federal Government. The Electronic Code of Federal Regulations (eCFR) is a continuously updated online version of the CFR. It is not an official legal edition of the CFR.{' '}
          <a
            href="https://www.ecfr.gov/reader-aids/understanding-the-ecfr/what-is-the-ecfr"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about the eCFR, its status, and the editorial process (opens in new tab)"
          >
            Learn more about the eCFR, its status, and the editorial process.
          </a>
        </p>
      </div>
    </header>
  );
}
