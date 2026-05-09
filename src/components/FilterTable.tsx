import { useState } from 'react';

interface FilterOption {
    id: string;
    label: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    type?: 'text' | 'select';
}

interface FilterTableProps {
    filters: FilterOption[];
    onFilterChange: (filters: Record<string, string>) => void;
}

export default function FilterTable({ filters, onFilterChange }: FilterTableProps) {
    const [filterValues, setFilterValues] = useState<Record<string, string>>(
        filters.reduce((acc, filter) => ({ ...acc, [filter.id]: '' }), {})
    );

    const handleInputChange = (filterId: string, value: string) => {
        const updatedFilters = { ...filterValues, [filterId]: value };
        setFilterValues(updatedFilters);
        onFilterChange(updatedFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters = filters.reduce((acc, filter) => ({ ...acc, [filter.id]: '' }), {});
        setFilterValues(clearedFilters);
        onFilterChange(clearedFilters);
    };

    return (
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filters.map((filter) => (
                    <div key={filter.id}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {filter.label}
                        </label>
                        {filter.type === 'select' ? (
                            <select
                                value={filterValues[filter.id]}
                                onChange={(e) => handleInputChange(filter.id, e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none hover:border-gray-400 transition"
                            >
                                <option value="">{filter.placeholder || `Seleccionar ${filter.label}`}</option>
                                {filter.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={filterValues[filter.id]}
                                onChange={(e) => handleInputChange(filter.id, e.target.value)}
                                placeholder={filter.placeholder || `Buscar por ${filter.label.toLowerCase()}...`}
                                className="w-full rounded-lg border-2 border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none hover:border-gray-400 transition"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleClearFilters}
                    className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                    🔄 Limpiar filtros
                </button>
            </div>
        </div>
    );
}
