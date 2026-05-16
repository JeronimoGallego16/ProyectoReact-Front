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

const CAREER_COLUMNS = ["code", "name", "description", "is_active"];
const SEMESTER_COLUMNS = ["code", "name", "start_date", "end_date", "is_active"];

const ADMIN_ACTIONS = [
    { name: "view", label: "Ver" },
    { name: "edit", label: "Editar" },
    { name: "archive", label: "Archivar" },
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

    const role: UserRole = "ADMIN";
    const editable = canEdit(role);

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
        getArchiveConfirm: (career) => `¿Archivar la carrera "${career.name}"? Esta acción no se puede deshacer.`,
        getViewMessage: (career) => `Carrera: ${career.name} (${career.code})`,
        successMessages: {
            create: "Carrera creada exitosamente.",
            update: "Carrera actualizada exitosamente.",
            archive: "Carrera archivada exitosamente.",
        },
        errorMessages: {
            create: "No se pudo crear la carrera.",
            update: "No se pudo actualizar la carrera.",
            archive: "No se pudo archivar la carrera.",
        },
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
        ],
        mapSaveValues: (values, form) => ({
            code: values.code ?? form.code,
            name: values.name ?? form.name,
            start_date: values.start_date ?? form.start_date,
            end_date: values.end_date ?? form.end_date,
            is_active: form.is_active,
        }),
        validateSave: (values) => {
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
                                        is_active: career.is_active ? "Activa" : "Inactiva",
                                    }))}
                                    columns={CAREER_COLUMNS}
                                    actions={ADMIN_ACTIONS}
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
                                    is_active: semester.is_active ? "Activo" : "Inactivo",
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
        </div>
    );
};

export default AcademicPage;
