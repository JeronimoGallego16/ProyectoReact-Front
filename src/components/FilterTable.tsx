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
    initialValues?: Record<string, string>;
}

export default function FilterTable({ filters, onFilterChange, initialValues }: FilterTableProps) {
    const [filterValues, setFilterValues] = useState<Record<string, string>>(
        initialValues || filters.reduce((acc, filter) => ({ ...acc, [filter.id]: '' }), {})
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
        <div className="mb-6 overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filters.map((filter) => (
                    <div key={filter.id}>
                        <label className="mb-2 block font-medium text-black dark:text-white">
                            {filter.label}
                        </label>
                        {filter.type === 'select' ? (
                            <select
                                value={filterValues[filter.id]}
                                onChange={(e) => handleInputChange(filter.id, e.target.value)}
                                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
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
                                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-black outline-none transition focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleClearFilters}
                    className="rounded-md border border-stroke px-5 py-2.5 text-sm font-medium text-black transition hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                >
                    Limpiar filtros
                </button>
            </div>
            </div>
        </div>
    );
}
