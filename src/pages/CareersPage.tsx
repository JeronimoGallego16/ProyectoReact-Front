import { useState, useEffect } from 'react';
import FilterTable from '../components/FilterTable';
import { careerService } from '../services/CareerService';
import { toast } from 'react-hot-toast';
import { Career, CareerWithDetails, CareerCreateInput, CareerUpdateInput } from '../models/Career';

export default function CareersPage() {
    const [careersData, setCareersData] = useState<CareerWithDetails[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({});

    // Modales
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Estados para crear
    const [createFormData, setCreateFormData] = useState({
        code: '',
        name: '',
        description: '',
    });

    // Estados para editar
    const [editFormData, setEditFormData] = useState({
        code: '',
        name: '',
        description: '',
    });

    const [editingCareerId, setEditingCareerId] = useState<string>('');
    const [careerToDelete, setCareerToDelete] = useState<string>('');

    // Estados de carga
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Cargar carreras al montar
    useEffect(() => {
        const fetchCareers = async () => {
            try {
                setLoading(true);
                const careers = await careerService.getCareers();
                setCareersData((careers as CareerWithDetails[]) || []);
            } catch (error) {
                console.error('Error cargando carreras:', error);
                toast.error('Error cargando las carreras');
            } finally {
                setLoading(false);
            }
        };

        fetchCareers();
    }, []);

    const handleFilterChange = (filters: Record<string, string>) => {
        setFilters(filters);
    };

    const filteredTableData = careersData.filter(career => {
        return (
            (!filters.code || career.code?.toLowerCase().includes(filters.code.toLowerCase())) &&
            (!filters.name || career.name?.toLowerCase().includes(filters.name.toLowerCase()))
        );
    });

    // ===== CREAR CARRERA =====
    const handleCreateCareer = async () => {
        if (!createFormData.code.trim() || !createFormData.name.trim()) {
            toast.error('El código y nombre son obligatorios');
            return;
        }

        try {
            setIsCreating(true);
            const payload: CareerCreateInput = {
                code: createFormData.code.trim(),
                name: createFormData.name.trim(),
                description: createFormData.description.trim(),
                is_active: true,
            };

            const result = await careerService.createCareer(payload);
            if (result) {
                toast.success('Carrera creada correctamente');
                setShowCreateModal(false);
                setCreateFormData({ code: '', name: '', description: '' });

                // Recargar carreras
                const careers = await careerService.getCareers();
                setCareersData((careers as CareerWithDetails[]) || []);
            } else {
                toast.error('Error al crear la carrera');
            }
        } catch (error: any) {
            console.error('Error creando carrera:', error);
            toast.error(error.message || 'Error al crear la carrera');
        } finally {
            setIsCreating(false);
        }
    };

    // ===== EDITAR CARRERA =====
    const handleOpenEditModal = (career: Career) => {
        setEditingCareerId(career.id);
        setEditFormData({
            code: career.code,
            name: career.name,
            description: career.description || '',
        });
        setShowEditModal(true);
    };

    const handleEditCareer = async () => {
        if (!editFormData.code.trim() || !editFormData.name.trim()) {
            toast.error('El código y nombre son obligatorios');
            return;
        }

        try {
            setIsEditing(true);
            const payload: CareerUpdateInput = {
                code: editFormData.code.trim(),
                name: editFormData.name.trim(),
                description: editFormData.description.trim(),
            };

            const result = await careerService.updateCareer(editingCareerId, payload);
            if (result) {
                toast.success('Carrera actualizada correctamente');
                setShowEditModal(false);
                setEditingCareerId('');

                // Recargar carreras
                const careers = await careerService.getCareers();
                setCareersData((careers as CareerWithDetails[]) || []);
            } else {
                toast.error('Error al actualizar la carrera');
            }
        } catch (error: any) {
            console.error('Error editando carrera:', error);
            toast.error(error.message || 'Error al actualizar la carrera');
        } finally {
            setIsEditing(false);
        }
    };

    // ===== ELIMINAR CARRERA =====
    const handleOpenDeleteConfirm = (careerId: string) => {
        setCareerToDelete(careerId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteCareer = async () => {
        try {
            setIsDeleting(true);
            const result = await careerService.archiveCareer(careerToDelete);
            if (result) {
                toast.success('Carrera eliminada correctamente');
                setShowDeleteConfirm(false);
                setCareerToDelete('');

                // Recargar carreras
                const careers = await careerService.getCareers();
                setCareersData((careers as CareerWithDetails[]) || []);
            } else {
                toast.error('Error al eliminar la carrera');
            }
        } catch (error: any) {
            console.error('Error eliminando carrera:', error);
            toast.error(error.message || 'Error al eliminar la carrera');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return <div className="p-6">Cargando carreras...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-black dark:text-white">Gestión de Carreras</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-lg bg-green-700 px-6 py-2 font-medium text-white hover:bg-green-800"
                >
                    + Nueva Carrera
                </button>
            </div>

            {/* Filtros */}
            <FilterTable
                filters={[
                    { id: 'code', label: 'Código', placeholder: 'Buscar por código...', type: 'text' },
                    { id: 'name', label: 'Nombre', placeholder: 'Buscar por nombre...', type: 'text' },
                ]}
                onFilterChange={handleFilterChange}
            />

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg border border-strokedark bg-white dark:bg-boxdark">
                <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-meta-4">
                        <tr>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Código</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Nombre</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Descripción</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Estado</th>
                            <th className="px-4 py-4 text-left font-semibold text-black dark:text-white">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTableData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No hay carreras disponibles
                                </td>
                            </tr>
                        ) : (
                            filteredTableData.map((career, index) => (
                                <tr key={career.id} className={index % 2 === 0 ? 'bg-white dark:bg-boxdark' : 'bg-gray-50 dark:bg-meta-4'}>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white font-semibold">{career.code}</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{career.name}</td>
                                    <td className="px-4 py-5 text-sm text-black dark:text-white">{career.description || '-'}</td>
                                    <td className="px-4 py-5 text-sm">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${career.is_active
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {career.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-sm">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleOpenEditModal(career)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => handleOpenDeleteConfirm(career.id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Crear Carrera */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                        <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Crear Nueva Carrera</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: ING-SYS"
                                    value={createFormData.code}
                                    onChange={(e) => setCreateFormData({ ...createFormData, code: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Ingeniería en Sistemas"
                                    value={createFormData.name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    placeholder="Descripción de la carrera..."
                                    value={createFormData.description}
                                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateFormData({ code: '', name: '', description: '' });
                                }}
                                disabled={isCreating}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateCareer}
                                disabled={isCreating}
                                className="flex-1 rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 disabled:opacity-50"
                            >
                                {isCreating ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar Carrera */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                        <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">Editar Carrera</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Código *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Código de la carrera..."
                                    value={editFormData.code}
                                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nombre de la carrera..."
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                    Descripción (Opcional)
                                </label>
                                <textarea
                                    placeholder="Descripción de la carrera..."
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    rows={3}
                                    className="w-full rounded border border-stroke bg-transparent py-2 px-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingCareerId('');
                                }}
                                disabled={isEditing}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditCareer}
                                disabled={isEditing}
                                className="flex-1 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                            >
                                {isEditing ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
                        <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">Confirmar Eliminación</h2>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            ¿Está seguro que desea eliminar esta carrera? Esta acción no se puede deshacer.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setCareerToDelete('');
                                }}
                                disabled={isDeleting}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteCareer}
                                disabled={isDeleting}
                                className="flex-1 rounded-lg bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 disabled:opacity-50"
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
