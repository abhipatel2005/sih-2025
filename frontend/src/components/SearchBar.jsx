import React from 'react';

const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="mb-6 sm:mb-12">
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border-0 border-b border-gray-200 bg-transparent py-3 sm:py-4 text-sm placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-colors duration-200"
      />
    </div>
  );
};

export default SearchBar;
