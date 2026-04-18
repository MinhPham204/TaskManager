import React from 'react';
import { Link } from 'react-router-dom';
import { LuChevronRight, LuHouse } from 'react-icons/lu';

/**
 * Breadcrumb Navigation Component
 * @param {Array} items - Array of breadcrumb items
 * items format: [
 *   { label: 'Dashboard', href: '/admin/dashboard' },
 *   { label: 'Teams', href: '/admin/teams' },
 *   { label: 'Team A' } // Current page (no href)
 * ]
 */
const Breadcrumb = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm">
      {/* Home icon */}
      <Link 
        to="/" 
        className="text-gray-500 hover:text-gray-700 transition-colors"
        title="Home"
      >
        <LuHouse className="w-4 h-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* Separator */}
          <LuChevronRight className="w-4 h-4 text-gray-400" />
          
          {/* Breadcrumb item */}
          {item.href ? (
            <Link
              to={item.href}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
