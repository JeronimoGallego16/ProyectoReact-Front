import React, { useEffect, useMemo, useState } from 'react';
import GenericTable from '../../components/GenericTable';
import PageHeader from '../../components/PageHeader';
import TableScroll from '../../components/TableScroll';
import VerticalTextFormCard from '../../components/VerticalTextFormCard';
import ModalLauncher from '../../components/ModalLauncher';
import { Subject } from '../../models/Subject';
import { subjectService } from '../../services/SubjectService';
import { useAcademicEntityCrud } from '../../hooks/useAcademicEntityCrud';

const SUBJECT_COLUMNS = ['code', 'name', 'description', 'credits', 'is_active_label'];

const SUBJECT_ACTIONS = [
  { name: 'view', label: 'Ver' },
  { name: 'edit', label: 'Editar' },
  { name: 'archive', label: 'Archivar', visible: (item: Record<string, any>) => item.is_active },
  { name: 'reactivate', label: 'Reactivar', visible: (item: Record<string, any>) => !item.is_active },
];

const emptySubjectForm = (): Omit<Subject, 'id'> => ({
  code: '',
  name: '',
  description: '',
  credits: 1,
  is_active: true,
});

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [creditsFilter, setCreditsFilter] = useState<'all' | number>('all');
  const [detailItem, setDetailItem] = useState<Subject | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await subjectService.getSubjects();
    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const creditsOptions = useMemo(
    () => Array.from(new Set(subjects.map((subject) => subject.credits))).sort((a, b) => a - b),
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        subject.code.toLowerCase().includes(term) ||
        subject.name.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && subject.is_active) ||
        (statusFilter === 'archived' && !subject.is_active);

      const matchesCredits =
        creditsFilter === 'all' || subject.credits === creditsFilter;

      return matchesSearch && matchesStatus && matchesCredits;
    });
  }, [subjects, searchTerm, statusFilter, creditsFilter]);

  const openDetail = (subject: Subject) => {
    setDetailItem(subject);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailItem(null);
    setIsDetailOpen(false);
  };

  const subjectCrud = useAcademicEntityCrud<Subject>({
    emptyForm: emptySubjectForm(),
    loadData,
    createItem: subjectService.createSubject.bind(subjectService),
    updateItem: subjectService.updateSubject.bind(subjectService),
    archiveItem: subjectService.archiveSubject.bind(subjectService),
    reactivateItem: subjectService.reactivateSubject?.bind(subjectService),
    onView: (subject) => openDetail(subject),
    buildFields: (form) => [
      {
        name: 'code',
        label: 'Código',
        placeholder: 'Ej. BD101',
        type: 'text',
        value: form.code,
      },
      {
        name: 'name',
        label: 'Nombre',
        placeholder: 'Ingrese el nombre de la asignatura',
        type: 'text',
        value: form.name,
      },
      {
        name: 'description',
        label: 'Descripción',
        placeholder: 'Ingrese una descripción',
        kind: 'textarea',
        rows: 4,
        value: form.description ?? '',
      },
      {
        name: 'credits',
        label: 'Créditos',
        placeholder: 'Ej. 4',
        type: 'number',
        value: String(form.credits ?? ''),
      },
    ],
    mapSaveValues: (values, form) => ({
      code: values.code ?? form.code,
      name: values.name ?? form.name,
      description: values.description ?? form.description,
      credits: values.credits ? Number(values.credits) : form.credits,
      is_active: form.is_active,
    }),
    validateSave: (values) => {
      if (!values.code || !values.name) {
        return 'El código y el nombre son obligatorios.';
      }
      const credits = Number(values.credits);
      if (!values.credits || Number.isNaN(credits) || credits <= 0) {
        return 'Los créditos deben ser un número mayor a 0.';
      }
      return null;
    },
    getFormTitle: (mode) => {
      if (mode === 'create') return 'Nueva asignatura';
      if (mode === 'edit') return 'Editar asignatura';
      return '';
    },
    getFormDescription: (mode, selectedItem) => {
      if (mode === 'edit' && selectedItem) {
        return `Código: ${selectedItem.code} - ${selectedItem.name}`;
      }
      return '';
    },
    getArchiveConfirm: (subject) => `¿Archivar la asignatura "${subject.name}"?`,
    getReactivateConfirm: (subject) => `¿Reactivar la asignatura "${subject.name}"?`,
    getViewMessage: (subject) => `Asignatura: ${subject.name} (${subject.code})`,
    successMessages: {
      create: 'Asignatura creada exitosamente.',
      update: 'Asignatura actualizada exitosamente.',
      archive: 'Asignatura archivada exitosamente.',
      reactivate: 'Asignatura reactivada exitosamente.',
    },
    errorMessages: {
      create: 'No se pudo crear la asignatura.',
      update: 'No se pudo actualizar la asignatura.',
      archive: 'No se pudo archivar la asignatura.',
      reactivate: 'No se pudo reactivar la asignatura.',
      validation: 'No se pudo validar la asignatura.',
    },
  });

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title="Asignaturas"
        description="Gestiona el catálogo de asignaturas del sistema, así como su estado y créditos."
        primaryAction={ {
          label: '+ Nueva asignatura',
          onClick: subjectCrud.startCreate,
        }}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="rounded-md border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <label className="mb-2 block text-sm font-medium text-bodydark">Buscar</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por código o nombre"
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 font-medium text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>

        <div className="rounded-md border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <label className="mb-2 block text-sm font-medium text-bodydark">Estado</label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'active' | 'archived')}
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 font-medium text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="archived">Archivadas</option>
          </select>
        </div>

        <div className="rounded-md border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
          <label className="mb-2 block text-sm font-medium text-bodydark">Créditos</label>
          <select
            value={creditsFilter}
            onChange={(event) => setCreditsFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            className="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 font-medium text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          >
            <option value="all">Todos</option>
            {creditsOptions.map((credits) => (
              <option key={credits} value={credits}>
                {credits}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="h-full overflow-y-auto">
          {loading ? (
            <p className="p-6 text-sm text-body dark:text-bodydark">Cargando datos…</p>
          ) : filteredSubjects.length === 0 ? (
            <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron asignaturas.</p>
          ) : (
            <TableScroll maxHeight="55vh">
              <GenericTable
                data={filteredSubjects.map((subject) => ({
                  ...subject,
                  is_active_label: subject.is_active ? 'Activa' : 'Archivada',
                }))}
                columns={SUBJECT_COLUMNS}
                actions={SUBJECT_ACTIONS}
                onAction={subjectCrud.handleAction}
              />
            </TableScroll>
          )}
        </div>
      </div>

      {subjectCrud.isOpen && (
        <ModalLauncher isOpen={subjectCrud.isOpen} onClose={subjectCrud.close}>
          {() => (
            <VerticalTextFormCard
              title={subjectCrud.title}
              description={subjectCrud.description}
              fields={subjectCrud.fields}
              saveLabel={subjectCrud.saveLabel}
              cancelLabel="Cancelar"
              onSave={subjectCrud.handleSave}
              onCancel={subjectCrud.close}
            />
          )}
        </ModalLauncher>
      )}

      {isDetailOpen && detailItem && (
        <ModalLauncher isOpen={isDetailOpen} onClose={closeDetail}>
          {() => (
            <div className="space-y-5 p-4">
              <div>
                <h3 className="text-xl font-semibold text-black dark:text-white">Detalles de la asignatura</h3>
                <p className="mt-1 text-sm text-body dark:text-bodydark">
                  Revisa la información completa de la asignatura y su estado.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                  <p className="text-sm font-medium text-body dark:text-bodydark">Código</p>
                  <p className="mt-2 text-base text-black dark:text-white">{detailItem.code}</p>
                </div>
                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                  <p className="text-sm font-medium text-body dark:text-bodydark">Nombre</p>
                  <p className="mt-2 text-base text-black dark:text-white">{detailItem.name}</p>
                </div>
                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                  <p className="text-sm font-medium text-body dark:text-bodydark">Créditos</p>
                  <p className="mt-2 text-base text-black dark:text-white">{detailItem.credits}</p>
                </div>
                <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                  <p className="text-sm font-medium text-body dark:text-bodydark">Estado</p>
                  <p className="mt-2 text-base text-black dark:text-white">{detailItem.is_active ? 'Activa' : 'Archivada'}</p>
                </div>
                <div className="sm:col-span-2 rounded-md border border-stroke p-4 dark:border-strokedark">
                  <p className="text-sm font-medium text-body dark:text-bodydark">Descripción</p>
                  <p className="mt-2 text-base text-black dark:text-white">{detailItem.description || 'Sin descripción'}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeDetail}
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-opacity-90"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </ModalLauncher>
      )}
    </div>
  );
};

export default SubjectsPage;
