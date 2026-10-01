"use client";
import { useGetDepartmentsQuery } from "@/store/api";

export function DepartmentInput({
  value,
  onChange,
  placeholder = "Отдел",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { data: departments } = useGetDepartmentsQuery();
  return (
    <>
      <input
        className="input"
        list="department-options"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <datalist id="department-options">
        {departments?.map((d) => <option key={d.id} value={d.name} />)}
      </datalist>
    </>
  );
}