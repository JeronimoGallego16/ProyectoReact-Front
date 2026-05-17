import React, { useState } from "react";
import GenericTable from "../components/GenericTable";
import SelectableTable from "../components/SelectableTable";
import InputTable from "../components/InputTable";

const TableTest: React.FC = () => {
    const [inputData, setInputData] = useState([
        { id: "1", nombre: "Juan Pérez", email: "juan@example.com", estado: "Activo" },
        { id: "2", nombre: "María García", email: "maria@example.com", estado: "Activo" },
        { id: "3", nombre: "Carlos López", email: "carlos@example.com", estado: "Inactivo" },
    ]);

    const testData = [
        { id: "1", nombre: "Juan Pérez", email: "juan@example.com", estado: "Activo" },
        { id: "2", nombre: "María García", email: "maria@example.com", estado: "Activo" },
        { id: "3", nombre: "Carlos López", email: "carlos@example.com", estado: "Inactivo" },
    ];

    const testColumns = ["nombre", "email", "estado"];

    const testActions = [
        { name: "edit", label: "Editar" },
        { name: "delete", label: "Eliminar" },
        { name: "view", label: "Ver" },
    ];

    const handleAction = (actionName: string, item: Record<string, any>) => {
        console.log(`Acción: ${actionName}`, item);
    };

    const handleInputChange = (rowIndex: number, column: string, value: string) => {
        const newData = [...inputData];
        newData[rowIndex] = { ...newData[rowIndex], [column]: value };
        setInputData(newData);
    };

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">
                Prueba de Tablas
            </h1>

            <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Tabla Genérica (Texto)
                </h2>
                <GenericTable
                    data={testData}
                    columns={testColumns}
                    actions={testActions}
                    onAction={handleAction}
                />
            </div>

            <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Tabla Seleccionable - Modo 1 (Radio)
                </h2>
                <SelectableTable
                    data={testData}
                    columns={testColumns}
                    actions={testActions}
                    onAction={handleAction}
                    selectionMode={1}
                />
            </div>

            <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Tabla Seleccionable - Modo 2 (Checkboxes)
                </h2>
                <SelectableTable
                    data={testData}
                    columns={testColumns}
                    actions={testActions}
                    onAction={handleAction}
                    selectionMode={2}
                />
            </div>

            <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-black dark:text-white">
                    Tabla con Inputs
                </h2>
                <InputTable
                    data={inputData}
                    columns={testColumns}
                    actions={testActions}
                    onAction={handleAction}
                    onInputChange={handleInputChange}
                    />
                </div>
            </div>
        );
    };

export default TableTest;
