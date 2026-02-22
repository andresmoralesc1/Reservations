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
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto">
      {sections.map((section) => {
        const isSelected = selectedSection === section.value
        return (
          <button
            key={section.value}
            onClick={() => onSectionChange(section.value)}
            className={`px-4 sm:px-5 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
              isSelected
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-white hover:border-gray-400 hover:shadow-sm"
            }`}
          >
            <span className="flex items-center gap-2">
              {section.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {section.count}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
