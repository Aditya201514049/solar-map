import { useState } from "react";

const SearchBox = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  // Handle Enter key or button click
  const handleSearch = () => {
    if (!query) return;
    onSearch(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="absolute top-4 left-4 z-50 bg-white p-2 rounded shadow-md flex">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search address"
        className="border p-1 rounded w-64"
      />
      <button
        onClick={handleSearch}
        className="ml-2 bg-blue-500 text-white px-3 rounded hover:bg-blue-600"
      >
        Search
      </button>
    </div>
  );
};

export default SearchBox;
