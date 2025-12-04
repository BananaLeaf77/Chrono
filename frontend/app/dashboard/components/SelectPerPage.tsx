// components/PerPageSelect.tsx
import Select from "react-select";

interface PerPageSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  placeholder?: string;
}

export default function PerPageSelect({
  value,
  onChange,
  options = [4, 8, 20, 100],
  placeholder = "Tampilkan per halaman",
}: PerPageSelectProps) {
  const selectOptions = options.map((size) => ({
    value: size,
    label: `${size} per halaman`,
  }));

  return (
    <Select
      value={selectOptions.find((opt) => opt.value === value)}
      onChange={(selected) => selected && onChange(selected.value)}
      options={selectOptions}
      isSearchable={false}
      placeholder={placeholder}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      menuPlacement="bottom"
      className="w-full"
      classNamePrefix="perpage-select"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 44,
          borderRadius: "0.75rem",
          border: state.isFocused ? "2px solid #a78bfa" : "1px solid #d1d5db",
          boxShadow: state.isFocused
            ? "0 0 0 4px rgba(167, 139, 250, 0.15)"
            : "none",
          backgroundColor: "white",
          fontSize: "0.875rem",
          fontWeight: 500,
          transition: "all 200ms",
          "&:hover": { borderColor: "#a78bfa" },
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
        menu: (base) => ({
          ...base,
          marginTop: 4,
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? "#2563EB"
            : state.isFocused
            ? "#d1d5db"
            : "white",
          color: state.isSelected ? "white" : "#",
          fontWeight: state.isSelected ? "bold" : "500",
          padding: "10px 16px",
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: "#a78bfa",
        }),
        indicatorSeparator: () => ({ display: "none" }),
      }}
    />
  );
}
