import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import type { ResumeData } from "@/lib/types";

/** A real Lettr template rendered as a "photo" of a resume, at a fixed width. */
export function ResumeShot({
  template,
  data,
  width,
  className = "",
}: {
  template: string;
  data: ResumeData;
  width: number | string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-md overflow-hidden shadow-[0_18px_40px_rgba(4,22,50,0.16)] aspect-[1/1.32] ${className}`}
      style={{ width }}
    >
      <TemplateThumbnail id={template} data={data} renderWidth={520} />
    </div>
  );
}

/** A deliberately weak "before" resume: cramped, duty-based, generic. Static markup on purpose. */
export function BeforeResume({ width }: { width: number | string }) {
  return (
    <div
      aria-label="Example resume before Lettr"
      className="bg-white rounded-md shadow-[0_10px_24px_rgba(4,22,50,0.10)] aspect-[1/1.32] p-[6%] text-[#333] overflow-hidden saturate-50"
      style={{ width, fontFamily: "'Times New Roman', Times, serif" }}
    >
      <p className="text-[15px] font-bold leading-tight">Rahul Verma</p>
      <p className="text-[10px] font-bold">Sales Executive</p>
      <p className="text-[8px] text-[#666]">rahul.v@email.com | +91 98XXX XXXXX | Delhi</p>
      {[
        ["OBJECTIVE", ["To work in a reputed organisation where I can use my skills and grow along with the company."]],
        ["WORK EXPERIENCE", ["Sales Executive, Apex Distributors (2021 - Present)", "• Responsible for sales in North region.", "• Handled clients and dealers.", "• Did follow ups and made reports.", "Sales Trainee, Kumar Traders (2019 - 2021)", "• Assisted senior sales team.", "• Data entry work."]],
        ["EDUCATION", ["B.Com, Delhi University, 2019"]],
        ["SKILLS", ["MS Office, Communication, Hard working, Team player"]],
      ].map(([title, lines]) => (
        <div key={title as string} className="mt-[5%]">
          <p className="text-[8.5px] font-bold border-b border-[#999] pb-0.5">{title as string}</p>
          {(lines as string[]).map((l) => (
            <p key={l} className={`text-[8.5px] leading-snug mt-0.5 ${l.startsWith("•") ? "pl-2" : ""}`}>{l}</p>
          ))}
        </div>
      ))}
    </div>
  );
}
