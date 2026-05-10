import React from "react";

interface Action {
    name: string;
    label: string;
}

interface InputTableProps {
    data: Record<string, any>[];
    columns: string[];
    actions: Action[];
    onAction: (name: string, item: Record<string, any>) => void;
    onInputChange: (rowIndex: number, column: string, value: string) => void;
}

const InputTable: React.FC<InputTableProps> = ({ data, columns, actions, onAction, onInputChange }) => {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            {columns.map((col, index) => (
                                <th
                                    key={col}
                                    className={`py-4 px-4 font-medium text-black dark:text-white ${
                                        index === 0 ? "min-w-[220px] xl:pl-11" : "min-w-[150px]"
                                    }`}
                                >
                                    {col}
                                </th>
                            ))}
                            <th className="py-4 px-4 font-medium text-black dark:text-white">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                {columns.map((col, colIndex) => (
                                    <td
                                        key={col}
                                        className={`border-b border-[#eee] py-5 px-4 dark:border-strokedark ${
                                            colIndex === 0 ? "pl-9 xl:pl-11" : ""
                                        }`}
                                    >
                                        <input
                                            type="text"
                                            value={item[col]}
                                            onChange={(e) => onInputChange(index, col, e.target.value)}
                                            className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                        />
                                    </td>
                                ))}

                                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                                    <div className="flex items-center gap-2">
                                        {actions.map((action) => (
                                            <button
                                                key={action.name}
                                                onClick={() => onAction(action.name, item)}
                                                type="button"
                                                className={`rounded-md border border-stroke px-2 py-1 text-xs font-medium transition
                                                    hover:bg-gray-2 dark:border-strokedark
                                                    ${
                                                        action.name === "delete"
                                                            ? "text-red-500 hover:bg-red-100"
                                                            : ""
                                                    }
                                                    ${
                                                        action.name === "view"
                                                            ? "text-blue-500 hover:bg-blue-100"
                                                            : ""
                                                    }
                                                    ${
                                                        action.name === "download"
                                                            ? "text-green-500 hover:bg-green-100"
                                                            : ""
                                                    }
                                                `}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InputTable;
