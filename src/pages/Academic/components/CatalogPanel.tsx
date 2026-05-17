import React from 'react';
import { Subject } from '../../../models/Subject';

type Props = {
  subjects: Subject[];
  searchTerm: string;
  onSearch: (v: string) => void;
  onAdd: (s: Subject) => void;
  editable: boolean;
};

const CatalogPanel: React.FC<Props> = ({ subjects, searchTerm, onSearch, onAdd, editable }) => {
  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">Catálogo de asignaturas</h3>
      </div>
      <div className="p-4">
        <input
          type="text"
          placeholder="Buscar por nombre o código…"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="mb-4 w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition placeholder:text-bodydark dark:border-strokedark dark:text-white"
        />

        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {subjects.length === 0 ? (
            <p className="text-xs text-body dark:text-bodydark">{searchTerm ? 'No se encontraron asignaturas' : 'Todas las asignaturas están agregadas'}</p>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between rounded border border-stroke bg-gray-2 p-2 dark:border-strokedark dark:bg-meta-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white truncate">{subject.code}</p>
                  <p className="text-xs text-body dark:text-bodydark truncate">{subject.name}</p>
                </div>
                {editable && (
                  <button onClick={() => onAdd(subject)} className="ml-2 flex-shrink-0 rounded bg-primary px-2 py-1 text-white hover:bg-opacity-90">+</button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPanel;