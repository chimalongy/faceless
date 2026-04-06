// components/ui/CollapsibleSection.jsx
'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
  borderTopColor = 'from-gray-500 to-gray-400',
  cardClassName = 'relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm',
  headerActions,
  maxHeight = '600px',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cardClassName}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${borderTopColor}`} />
      
      <div className="p-2 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                >
                  {isOpen ? (
                    <FaChevronUp className="text-gray-500" />
                  ) : (
                    <FaChevronDown className="text-gray-500" />
                  )}
                </button>
              </div>
              {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
            </div>
          </div>
          
          {headerActions && (
            <div className="flex items-center gap-3">
              {headerActions}
            </div>
          )}
        </div>
        
        {isOpen && (
          <div
            style={{ maxHeight }}
            className="overflow-y-auto overscroll-contain pr-1 transition-all duration-300 ease-in-out"
          >
            {children}
          </div>
        )}
        
        {!isOpen && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaChevronDown className="text-xs" />
              <span>Click to expand {title}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
