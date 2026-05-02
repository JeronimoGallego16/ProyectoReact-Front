import { useEffect, useState } from 'react';
import { rubricService } from '../services/RubricService'; // Tu gestor
import { Rubric } from '../models/Rubric';

const RubricList = () => {
    // 1. Estados para los datos, errores y carga
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 2. Función para llamar al gestor
    const loadRubrics = async () => {
        try {
            setLoading(true);
            const data = await rubricService.getRubrics();
            setRubrics(data);
        } catch (err) {
            setError("No se pudieron cargar las rúbricas. Revisa la conexión.");
        } finally {
            setLoading(false);
        }
    };

    const createRubric = async () => {
        try {
            setLoading(true);
            const created = await rubricService.createRubric({ title: "Nueva Rúbrica", description: "Descripción de la nueva rúbrica", subject_id: "A2" });
            if (created) {
                await loadRubrics();
            } else {
                setError('No se pudo crear la rúbrica');
            }
        } catch (err) {
            setError("No se pudieron cargar las rúbricas. Revisa la conexión.");
        } finally {
            setLoading(false);
        }
    };

    // 3. useEffect para disparar la carga cuando se monta el componente
    useEffect(() => {
        loadRubrics();
    }, []);

    // 4. Renderizado con estados
    console.log('rubrics (state):', rubrics);
    if (loading) return <p>Cargando rúbricas...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            {(Array.isArray(rubrics) ? rubrics : []).length === 0 ? (
                <p>No hay rúbricas creadas aún.</p>
            ) : (
                <ul>
                    {(Array.isArray(rubrics) ? rubrics : []).map((r, indx) => (
                        <li key={r.id ?? `${r.title}-${indx}`}>
                            <strong>{r.title}</strong> - {r.subject_id} - {r.description}
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={loadRubrics}>Recargar</button>
            <button onClick={createRubric} style={{ marginLeft: 8 }}>Crear rúbrica</button>
        </div>
    );
};

export default RubricList;