import React, { useEffect, useState } from "react";
import GenericTable from "../../components/GenericTable";
import TableScroll from "../../components/TableScroll";
import PageHeader from "../../components/PageHeader";
import VerticalTextFormCard from "../../components/VerticalTextFormCard";
import ModalLauncher from "../../components/ModalLauncher";
import { Career } from "../../models/Career";
import { Semester } from "../../models/Semester";
import { UserRole } from "../../models/user";
import { careerService } from "../../services/CareerService";
import { semesterService } from "../../services/SemesterService";
import { useAcademicEntityCrud } from "../../hooks/useAcademicEntityCrud";

const CAREER_COLUMNS = ["code", "name", "description", "is_active_label"];
const SEMESTER_COLUMNS = ["code", "name", "start_date", "end_date", "is_active_label"];

const CAREER_ACTIONS = [
    { name: "view", label: "Ver" },
    { name: "edit", label: "Editar" },
    { name: "archive", label: "Archivar", visible: (item: Record<string, any>) => item.is_active },
    { name: "reactivate", label: "Reactivar", visible: (item: Record<string, any>) => !item.is_active },
];

const SEMESTER_ACTIONS = [
    { name: "view", label: "Ver" },
    { name: "edit", label: "Editar" },
];

const canEdit = (role: UserRole): boolean => role === "ADMIN";

const emptyCareerForm = (): Omit<Career, "id"> => ({
    code: "",
    name: "",
    description: "",
    is_active: true,
});

const emptySemesterForm = (): Omit<Semester, "id"> => ({
    code: "",
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
});

const AcademicPage: React.FC = () => {
    const [careers, setCareers] = useState<Career[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"careers" | "semesters">("careers");
    const [detailItem, setDetailItem] = useState<Career | Semester | null>(null);
    const [detailType, setDetailType] = useState<"career" | "semester" | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

    const openDetail = (item: Career | Semester, type: "career" | "semester") => {
        setDetailItem(item);
        setDetailType(type);
        setIsDetailOpen(true);
    };

    const closeDetail = () => {
        setIsDetailOpen(false);
        setDetailItem(null);
        setDetailType(null);
    };

    const loadData = async () => {
        setLoading(true);
        const [careersData, semestersData] = await Promise.all([
            careerService.getCareers(),
            semesterService.getSemesters(),
        ]);
        setCareers(careersData);
        setSemesters(semestersData);
        setLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, []);

    const careerCrud = useAcademicEntityCrud<Career>({
        emptyForm: emptyCareerForm(),
        loadData,
        createItem: careerService.createCareer.bind(careerService),
        updateItem: careerService.updateCareer.bind(careerService),
        archiveItem: careerService.archiveCareer.bind(careerService),
        reactivateItem: careerService.reactivateCareer.bind(careerService),
        onView: (career) => openDetail(career, 'career'),
        buildFields: (form) => [
            {
                name: "code",
                label: "Código",
                placeholder: "Ej. ING-SIS",
                type: "text",
                value: form.code,
            },
            {
                name: "name",
                label: "Nombre",
                placeholder: "Ingrese el nombre de la carrera",
                type: "text",
                value: form.name,
            },
            {
                name: "description",
                label: "Descripción",
                placeholder: "Ingrese la descripción de la carrera",
                kind: "textarea",
                rows: 3,
                value: form.description,
            },
        ],
        mapSaveValues: (values, form) => ({
            code: values.code ?? form.code,
            name: values.name ?? form.name,
            description: values.description ?? form.description,
            is_active: form.is_active,
        }),
        validateSave: (values) => {
            if (!values.code || !values.name) {
                return "El código y el nombre son obligatorios.";
            }
            return null;
        },
        getFormTitle: (mode) => {
            if (mode === "create") return "Nueva carrera";
            if (mode === "edit") return "Editar carrera";
            return "";
        },
        getFormDescription: (mode, selectedItem) => {
            if (mode === "edit" && selectedItem) {
                return `Código: ${selectedItem.code} - ${selectedItem.name}`;
            }
            return "";
        },
        getArchiveConfirm: (career) => `¿Archivar la carrera "${career.name}'?`,
        getViewMessage: (career) => `Carrera: ${career.name} (${career.code})`,
        successMessages: {
            create: "Carrera creada exitosamente.",
            update: "Carrera actualizada exitosamente.",
            archive: "Carrera archivada exitosamente.",
            reactivate: "Carrera reactivada exitosamente.",
        },
        errorMessages: {
            create: "No se pudo crear la carrera.",
            update: "No se pudo actualizar la carrera.",
            archive: "No se pudo archivar la carrera.",
            reactivate: "No se pudo reactivar la carrera.",
        },
        getReactivateConfirm: (career) => `¿Reactivar la carrera "${career.name}"?`,
    });

    const semesterCrud = useAcademicEntityCrud<Semester>({
        emptyForm: emptySemesterForm(),
        loadData,
        createItem: semesterService.createSemester.bind(semesterService),
        updateItem: semesterService.updateSemester.bind(semesterService),
        buildFields: (form) => [
            {
                name: "code",
                label: "Código",
                placeholder: "Ej. 2024-1",
                type: "text",
                value: form.code,
            },
            {
                name: "name",
                label: "Nombre",
                placeholder: "Ingrese el nombre del semestre",
                type: "text",
                value: form.name,
            },
            {
                name: "start_date",
                label: "Fecha inicio",
                type: "date",
                value: form.start_date,
            },
            {
                name: "end_date",
                label: "Fecha fin",
                type: "date",
                value: form.end_date,
            },
            {
                name: "is_active",
                label: "Estado",
                kind: "select",
                value: String(form.is_active),
                options: [
                    { value: "true", label: "Activo" },
                    { value: "false", label: "Inactivo" },
                ],
            },
        ],
        mapSaveValues: (values, form) => ({
            code: values.code ?? form.code,
            name: values.name ?? form.name,
            start_date: values.start_date ?? form.start_date,
            end_date: values.end_date ?? form.end_date,
            is_active: values.is_active ? values.is_active === "true" : form.is_active,
        }),
        validateSave: (values) => {
            if (!values.code || !values.name) {
                return "El código y el nombre son obligatorios.";
            }

            if (!values.start_date || !values.end_date) {
                return "Las fechas de inicio y fin son requeridas.";
            }

            if (new Date(values.start_date) >= new Date(values.end_date)) {
                return "La fecha de inicio debe ser anterior a la fecha de fin.";
            }

            return null;
        },
        getFormTitle: (mode) => {
            if (mode === "create") return "Nuevo semestre";
            if (mode === "edit") return "Editar semestre";
            return "";
        },
        getFormDescription: (mode, selectedItem) => {
            if (mode === "edit" && selectedItem) {
                return `Código: ${selectedItem.code} - ${selectedItem.name}`;
            }
            return "";
        },
        onView: (semester) => openDetail(semester, 'semester'),
        getViewMessage: (semester) => `Semestre: ${semester.name} (${semester.code})`,
        successMessages: {
            create: "Semestre creado exitosamente.",
            update: "Semestre actualizado exitosamente.",
        },
        errorMessages: {
            create: "No se pudo crear el semestre.",
            update: "No se pudo actualizar el semestre.",
            validation: "No se pudo validar el semestre.",
        },
    });

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <PageHeader
                title="Académico"
                description="Gestiona las carreras y los semestres del sistema."
                primaryAction={editable ? {
                    label: activeTab === "careers" ? "+ Nueva carrera" : "+ Nuevo semestre",
                    onClick: () => {
                        if (activeTab === "careers") {
                            careerCrud.startCreate();
                        } else {
                            semesterCrud.startCreate();
                        }
                    },
                } : undefined}
            />

            <div className="mb-4 border-b border-stroke dark:border-strokedark">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("careers")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === "careers"
                                ? "border-b-2 border-primary text-primary dark:border-primary dark:text-primary"
                                : "text-body hover:text-primary dark:text-bodydark dark:hover:text-primary"
                        }`}
                    >
                        Carreras
                    </button>
                    <button
                        onClick={() => setActiveTab("semesters")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === "semesters"
                                ? "border-b-2 border-primary text-primary dark:border-primary dark:text-primary"
                                : "text-body hover:text-primary dark:text-bodydark dark:hover:text-primary"
                        }`}
                    >
                        Semestres
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark max-h-[70vh]">
                <div className="h-full overflow-y-auto">
                    {loading ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">Cargando datos…</p>
                    ) : activeTab === "careers" ? (
                        careers.length === 0 ? (
                            <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron carreras.</p>
                        ) : (
                            <TableScroll maxHeight="55vh">
                                <GenericTable
                                    data={careers.map((career) => ({
                                        ...career,
                                        is_active_label: career.is_active ? "Activa" : "Inactiva",
                                    }))}
                                    columns={CAREER_COLUMNS}
                                    actions={CAREER_ACTIONS}
                                    onAction={careerCrud.handleAction}
                                />
                            </TableScroll>
                        )
                    ) : semesters.length === 0 ? (
                        <p className="p-6 text-sm text-body dark:text-bodydark">No se encontraron semestres.</p>
                        ) : (
                        <TableScroll maxHeight="55vh">
                                <GenericTable
                                data={semesters.map((semester) => ({
                                    ...semester,
                                    is_active_label: semester.is_active ? "Activo" : "Inactivo",
                                }))}
                                columns={SEMESTER_COLUMNS}
                                actions={SEMESTER_ACTIONS}
                                onAction={semesterCrud.handleAction}
                            />
                        </TableScroll>
                    )}
                </div>
            </div>

            {editable && careerCrud.isOpen && activeTab === "careers" && (
                <ModalLauncher
                    isOpen={careerCrud.isOpen}
                    onClose={careerCrud.close}
                >
                    {() => (
                        <VerticalTextFormCard
                            title={careerCrud.title}
                            description={careerCrud.description}
                            fields={careerCrud.fields}
                            saveLabel={careerCrud.saveLabel}
                            cancelLabel="Cancelar"
                            onSave={careerCrud.handleSave}
                            onCancel={careerCrud.close}
                        />
                    )}
                </ModalLauncher>
            )}

            {editable && semesterCrud.isOpen && activeTab === "semesters" && (
                <ModalLauncher
                    isOpen={semesterCrud.isOpen}
                    onClose={semesterCrud.close}
                >
                    {() => (
                        <VerticalTextFormCard
                            title={semesterCrud.title}
                            description={semesterCrud.description}
                            fields={semesterCrud.fields}
                            saveLabel={semesterCrud.saveLabel}
                            cancelLabel="Cancelar"
                            onSave={semesterCrud.handleSave}
                            onCancel={semesterCrud.close}
                        />
                    )}
                </ModalLauncher>
            )}

            {isDetailOpen && detailItem && (
                <ModalLauncher isOpen={isDetailOpen} onClose={closeDetail}>
                    {() => (
                        <div className="space-y-5 p-4">
                            <div>
                                <h3 className="text-xl font-semibold text-black dark:text-white">
                                    {detailType === 'career' ? 'Detalles de la carrera' : 'Detalles del semestre'}
                                </h3>
                                <p className="mt-1 text-sm text-body dark:text-bodydark">
                                    {detailType === 'career'
                                        ? 'Revisa la información completa de la carrera y su estado.'
                                        : 'Revisa los datos del semestre y su estado activo.'}
                                </p>
                            </div>

                            {detailType === 'career' ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Código</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Career).code}</p>
                                    </div>
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Nombre</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Career).name}</p>
                                    </div>
                                    <div className="sm:col-span-2 rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Descripción</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Career).description || 'Sin descripción'}</p>
                                    </div>
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Estado</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Career).is_active ? 'Activa' : 'Inactiva'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Código</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Semester).code}</p>
                                    </div>
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Nombre</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Semester).name}</p>
                                    </div>
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Inicio</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Semester).start_date}</p>
                                    </div>
                                    <div className="rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Fin</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Semester).end_date}</p>
                                    </div>
                                    <div className="sm:col-span-2 rounded-md border border-stroke p-4 dark:border-strokedark">
                                        <p className="text-sm font-medium text-body dark:text-bodydark">Estado</p>
                                        <p className="mt-2 text-base text-black dark:text-white">{(detailItem as Semester).is_active ? 'Activo' : 'Inactivo'}</p>
                                    </div>
                                </div>
                            )}

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

export default AcademicPage;
