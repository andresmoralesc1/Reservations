import React from "react"

export type SectionType = 'all' | 'interior' | 'patio' | 'terraza'

export interface SectionOption {
  value: SectionType
  label: string
  count: number
}

interface SectionTabsProps {
  sections: SectionOption[]
  selectedSection: SectionType
  onSectionChange: (section: SectionType) => void
}

export const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  selectedSection,
  onSectionChange,
}) => {
  return (
    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
      {sections.map((section) => (
        <button
          key={section.value}
          onClick={() => onSectionChange(section.value)}
          className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
            selectedSection === section.value
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {section.label} ({section.count})
        </button>
      ))}
    </div>
  )
}
