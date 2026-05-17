import React from 'react';
import GenericTable from '../../../components/GenericTable';
import { Subject } from '../../../models/Subject';

type Props = {
  subjects: Subject[];
  editable: boolean;
  onDelete: (s: Subject) => void;
  onEdit?: (s: Subject) => void;
  onView?: (s: Subject) => void;
};

const STUDY_PLAN_SUBJECTS_COLUMNS = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'credits', label: 'Créditos' },
];

const PlanTable: React.FC<Props> = ({ subjects, editable, onDelete, onEdit, onView }) => {
  const EDIT_ACTIONS = [
    { name: 'view', label: 'Ver' },
    { name: 'edit', label: 'Editar' },
    { name: 'delete', label: 'Eliminar' },
  ];

  const VIEW_ACTIONS: { name: string; label: string }[] = [
    { name: 'view', label: 'Ver' },
  ];

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white">Asignaturas del plan</h3>
      </div>
      <div>
        <GenericTable
          data={subjects}
          columns={STUDY_PLAN_SUBJECTS_COLUMNS}
          actions={editable ? EDIT_ACTIONS : VIEW_ACTIONS}
          onAction={(actionName, item) => {
            const subject = item as Subject;
            if (actionName === 'delete') onDelete(subject);
            if (actionName === 'edit' && onEdit) onEdit(subject);
            if (actionName === 'view' && onView) onView(subject);
          }}
        />
      </div>
    </div>
  );
};

export default PlanTable;
