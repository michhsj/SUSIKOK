import type { DetailItem, SummaryField } from "./admission-detail-types";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function AdmissionSummaryTable({
  fields,
}: {
  fields: DetailItem["summaryFields"];
}) {
  const fieldMap = new Map(fields.map((field) => [field.label, field] as const));

  const orderedFields: SummaryField[] = [
    fieldMap.get("전형방법"),
    fieldMap.get("학생부반영"),
    fieldMap.get("최저학력기준"),
    fieldMap.get("원서접수"),
    fieldMap.get("1차합격"),
    fieldMap.get("논술/면접") ?? fieldMap.get("실기/면접"),
    fieldMap.get("최종합격"),
  ].filter((field): field is SummaryField => Boolean(field));

  const specialField = fieldMap.get("전형특기사항") ?? fieldMap.get("특기사항");
  const colCount = Math.max(orderedFields.length, 1);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div
        className="grid border-b border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-700"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {orderedFields.map((field, index) => (
          <div
            key={`head-${field.label}-${index}`}
            className={cn(
              "px-3 py-2",
              index < orderedFields.length - 1 && "border-r border-slate-200",
            )}
          >
            {field.label}
          </div>
        ))}
      </div>

      <div
        className="grid bg-white text-[12px] text-slate-800"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {orderedFields.map((field, index) => (
          <div
            key={`body-${field.label}-${index}`}
            className={cn(
              "min-h-[42px] px-3 py-1.5 leading-5",
              index < orderedFields.length - 1 && "border-r border-slate-200",
            )}
          >
            {field.value}
          </div>
        ))}
      </div>

      {specialField ? (
        <div className="border-t border-slate-200 bg-white px-3 py-2.5">
          <div className="flex items-start gap-3">
            <div className="w-[96px] shrink-0 text-[12px] font-bold text-slate-700">
              전형특기사항
            </div>
            <div className="min-w-0 flex-1 break-words text-[12px] leading-5 text-slate-800">
              {specialField.value}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
