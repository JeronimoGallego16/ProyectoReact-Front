import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { rubricService } from '../services/RubricService';
import { evaluationService } from '../services/EvaluationService';
import { Rubric } from '../models/Rubric';
import { Criterion } from '../models/Criterion';
import { Scale } from '../models/Scale';
import { Evaluation } from '../models/Evaluation';

type ResultMessage = {
    type: 'success' | 'error' | 'info';
    text: string;
};

const initialRubricForm = {
    title: '',
    description: '',
    subject_id: '',
};

const initialRubricEditForm = {
    title: '',
    description: '',
    subject_id: '',
};

const initialCriterionForm = {
    name: '',
    description: '',
    weight: 1,
};

const initialCriterionEditForm = {
    name: '',
    description: '',
    weight: 1,
};

const initialScaleForm = {
    name: '',
    description: '',
    value: 1,
};

const initialScaleEditForm = {
    name: '',
    description: '',
    value: 1,
};

const initialAssessmentForm = {
    name: '',
    description: '',
    subject_id: '',
    group_id: '',
    weight: 1,
};

const initialAssessmentEditForm = {
    name: '',
    description: '',
    subject_id: '',
    group_id: '',
    weight: 1,
};

const Tests = () => {
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [selectedRubricId, setSelectedRubricId] = useState<string>('');
    const [selectedCriterionId, setSelectedCriterionId] = useState<string>('');
    const [selectedScaleId, setSelectedScaleId] = useState<string>('');
    const [criteriaByRubric, setCriteriaByRubric] = useState<Criterion[]>([]);
    const [scalesByCriterion, setScalesByCriterion] = useState<Scale[]>([]);
    const [copyScaleSourceId, setCopyScaleSourceId] = useState<string>('');
    const [copyScaleTargetCriterionId, setCopyScaleTargetCriterionId] = useState<string>('');
    const [copyScaleMessage, setCopyScaleMessage] = useState<string | null>(null);
    const [weightValidationMessage, setWeightValidationMessage] = useState<string | null>(null);
    const [rubricForm, setRubricForm] = useState(initialRubricForm);
    const [rubricEditForm, setRubricEditForm] = useState(initialRubricEditForm);
    const [criterionForm, setCriterionForm] = useState(initialCriterionForm);
    const [criterionEditForm, setCriterionEditForm] = useState(initialCriterionEditForm);
    const [scaleForm, setScaleForm] = useState(initialScaleForm);
    const [scaleEditForm, setScaleEditForm] = useState(initialScaleEditForm);
    const [assessments, setAssessments] = useState<Evaluation[]>([]);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
    const [assessmentForm, setAssessmentForm] = useState(initialAssessmentForm);
    const [assessmentEditForm, setAssessmentEditForm] = useState(initialAssessmentEditForm);
    const [associateRubricMessage, setAssociateRubricMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<ResultMessage | null>(null);

    const selectedRubric = useMemo(
        () => rubrics.find(rubric => rubric.id === selectedRubricId) ?? null,
        [rubrics, selectedRubricId]
    );

    const criteriaWeightTotal = useMemo(
        () => criteriaByRubric.reduce((total, criterion) => total + (Number(criterion.weight) || 0), 0),
        [criteriaByRubric]
    );

    const criteriaWeightRemaining = useMemo(
        () => Math.max(0, 100 - criteriaWeightTotal),
        [criteriaWeightTotal]
    );

    const copyScaleSource = useMemo(
        () => scalesByCriterion.find(scale => scale.id === copyScaleSourceId) ?? null,
        [scalesByCriterion, copyScaleSourceId]
    );

    const selectedCriterion = useMemo(
        () => criteriaByRubric.find(criterion => criterion.id === selectedCriterionId) ?? null,
        [criteriaByRubric, selectedCriterionId]
    );

    const selectedScale = useMemo(
        () => scalesByCriterion.find(scale => scale.id === selectedScaleId) ?? null,
        [scalesByCriterion, selectedScaleId]
    );

    const selectedAssessment = useMemo(
        () => assessments.find(assessment => assessment.id === selectedAssessmentId) ?? null,
        [assessments, selectedAssessmentId]
    );

    const showMessage = (type: ResultMessage['type'], text: string) => {
        setMessage({ type, text });
    };

    const clearMessage = () => setMessage(null);

    const loadRubrics = async () => {
        setLoading(true);
        clearMessage();
        try {
            const data = await rubricService.getRubrics();
            setRubrics(data);
            if (!selectedRubricId && data.length > 0) {
                setSelectedRubricId(data[0].id);
            }
            showMessage('success', `Rúbricas cargadas: ${data.length}`);
        } catch {
            showMessage('error', 'No se pudieron cargar las rúbricas.');
        } finally {
            setLoading(false);
        }
    };

    const loadCriteriaForRubric = async (rubricId: string) => {
        if (!rubricId) {
            setCriteriaByRubric([]);
            return;
        }

        setLoading(true);
        clearMessage();
        try {
            const data = await rubricService.getCriteriaByRubricId(rubricId);
            setCriteriaByRubric(data);
            showMessage('success', `Criterios cargados: ${data.length}`);
        } catch {
            showMessage('error', 'No se pudieron cargar los criterios.');
        } finally {
            setLoading(false);
        }
    };

    const loadScalesForCriterion = async (criterionId: string) => {
        if (!criterionId) {
            setScalesByCriterion([]);
            setSelectedScaleId('');
            setCopyScaleSourceId('');
            return;
        }

        setLoading(true);
        clearMessage();
        try {
            const data = await rubricService.getScaleByCriterionId(criterionId);
            setScalesByCriterion(data);
            setSelectedScaleId(data[0]?.id ?? '');
            showMessage('success', `Escalas cargadas: ${data.length}`);
        } catch {
            showMessage('error', 'No se pudieron cargar las escalas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRubrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedRubricId) {
            loadCriteriaForRubric(selectedRubricId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRubricId]);

    useEffect(() => {
        if (selectedCriterionId) {
            loadScalesForCriterion(selectedCriterionId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCriterionId]);

    useEffect(() => {
        if (selectedRubric) {
            setRubricEditForm({
                title: selectedRubric.title ?? '',
                description: selectedRubric.description ?? '',
                subject_id: selectedRubric.subject_id ?? '',
            });
        } else {
            setRubricEditForm(initialRubricEditForm);
        }
    }, [selectedRubric]);

    useEffect(() => {
        if (selectedCriterion) {
            setCriterionEditForm({
                name: selectedCriterion.name ?? '',
                description: selectedCriterion.description ?? '',
                weight: selectedCriterion.weight ?? 1,
            });
        } else {
            setCriterionEditForm(initialCriterionEditForm);
        }
    }, [selectedCriterion]);

    useEffect(() => {
        if (selectedScale) {
            setScaleEditForm({
                name: selectedScale.name ?? '',
                description: selectedScale.description ?? '',
                value: selectedScale.value ?? 1,
            });
        } else {
            setScaleEditForm(initialScaleEditForm);
        }
    }, [selectedScale]);

    useEffect(() => {
        if (selectedAssessment) {
            setAssessmentEditForm({
                name: selectedAssessment.name ?? '',
                description: selectedAssessment.description ?? '',
                subject_id: selectedAssessment.subject_id ?? '',
                group_id: selectedAssessment.group_id ?? '',
                weight: 1,
            });
        } else {
            setAssessmentEditForm(initialAssessmentEditForm);
        }
    }, [selectedAssessment]);

    const createRubric = async () => {
        clearMessage();
        if (!rubricForm.title.trim() || !rubricForm.subject_id.trim()) {
            showMessage('error', 'Título y subject_id son obligatorios.');
            return;
        }

        setLoading(true);
        try {
            const created = await rubricService.createRubric({
                title: rubricForm.title.trim(),
                description: rubricForm.description.trim(),
                subject_id: rubricForm.subject_id.trim(),
            });

            if (!created) {
                showMessage('error', 'No se pudo crear la rúbrica.');
                return;
            }

            showMessage('success', `Rúbrica creada: ${created.title}`);
            setRubricForm(initialRubricForm);
            await loadRubrics();
            setSelectedRubricId(created.id);
        } catch {
            showMessage('error', 'Error creando la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    const updateRubric = async () => {
        clearMessage();
        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para editarla.');
            return;
        }

        setLoading(true);
        try {
            const updated = await rubricService.updateRubric(selectedRubricId, {
                title: rubricEditForm.title.trim(),
                description: rubricEditForm.description.trim(),
                subject_id: rubricEditForm.subject_id.trim(),
            });

            if (!updated) {
                showMessage('error', 'No se pudo actualizar la rúbrica.');
                return;
            }

            showMessage('success', 'Rúbrica actualizada correctamente.');
            await loadRubrics();
        } catch {
            showMessage('error', 'Error actualizando la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    const createCriterion = async () => {
        clearMessage();
        setWeightValidationMessage(null);
        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica antes de crear un criterio.');
            return;
        }

        if (!criterionForm.name.trim()) {
            showMessage('error', 'El nombre del criterio es obligatorio.');
            return;
        }

        const newCriterionWeight = Number(criterionForm.weight) || 0;
        const validation = await rubricService.validateCriterionWeight(selectedRubricId, newCriterionWeight);
        setWeightValidationMessage(validation.message ?? `Total actual: ${validation.total.toFixed(2)}. Proyectado: ${validation.projectedTotal.toFixed(2)}.`);
        if (!validation.ok) {
            showMessage('error', validation.message ?? 'Los pesos de los criterios superarían 100.');
            return;
        }

        setLoading(true);
        try {
            const created = await rubricService.createCriterion({
                rubric_id: selectedRubricId,
                name: criterionForm.name.trim(),
                description: criterionForm.description.trim(),
                weight: newCriterionWeight,
            } as Omit<Criterion, 'id'>);

            if (!created) {
                showMessage('error', 'No se pudo crear el criterio.');
                return;
            }

            showMessage('success', `Criterio creado: ${created.name}`);
            setCriterionForm(initialCriterionForm);
            setSelectedCriterionId(created.id);
            await loadCriteriaForRubric(selectedRubricId);
        } catch {
            showMessage('error', 'Error creando el criterio.');
        } finally {
            setLoading(false);
        }
    };

    const updateCriterion = async () => {
        clearMessage();
        if (!selectedCriterionId) {
            showMessage('error', 'Selecciona un criterio para editarlo.');
            return;
        }

        setLoading(true);
        try {
            const updated = await rubricService.updateCriterion(selectedCriterionId, {
                name: criterionEditForm.name.trim(),
                description: criterionEditForm.description.trim(),
                weight: Number(criterionEditForm.weight) || 0,
            });

            if (!updated) {
                showMessage('error', 'No se pudo actualizar el criterio.');
                return;
            }

            showMessage('success', 'Criterio actualizado correctamente.');
            await loadCriteriaForRubric(selectedRubricId);
        } catch {
            showMessage('error', 'Error actualizando el criterio.');
        } finally {
            setLoading(false);
        }
    };

    const validateCriterionWeight = async () => {
        clearMessage();
        setWeightValidationMessage(null);

        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para validar el peso del criterio.');
            return;
        }

        const weight = Number(criterionForm.weight) || 0;
        const validation = await rubricService.validateCriterionWeight(selectedRubricId, weight);
        setWeightValidationMessage(validation.message ?? `Total actual: ${validation.total.toFixed(2)}. Proyectado: ${validation.projectedTotal.toFixed(2)}.`);
        if (!validation.ok) {
            showMessage('error', validation.message ?? 'Los pesos superarían 100.');
            return;
        }

        showMessage('success', `Validación correcta. Total proyectado: ${validation.projectedTotal.toFixed(2)}.`);
    };

    const createScale = async () => {
        clearMessage();
        if (!selectedCriterionId) {
            showMessage('error', 'Selecciona un criterio antes de crear una escala.');
            return;
        }

        if (!scaleForm.name.trim()) {
            showMessage('error', 'El nombre de la escala es obligatorio.');
            return;
        }

        setLoading(true);
        try {
            const created = await rubricService.createScale({
                criterion_id: selectedCriterionId,
                name: scaleForm.name.trim(),
                description: scaleForm.description.trim(),
                value: Number(scaleForm.value),
            } as Omit<Scale, 'id'>);

            if (!created) {
                showMessage('error', 'No se pudo crear la escala.');
                return;
            }

            showMessage('success', `Escala creada: ${created.name}`);
            setScaleForm(initialScaleForm);
            await loadScalesForCriterion(selectedCriterionId);
        } catch {
            showMessage('error', 'Error creando la escala.');
        } finally {
            setLoading(false);
        }
    };

    const updateScale = async () => {
        clearMessage();
        if (!selectedScaleId) {
            showMessage('error', 'Selecciona una escala para editarla.');
            return;
        }

        setLoading(true);
        try {
            const updated = await rubricService.updateScale(selectedScaleId, {
                name: scaleEditForm.name.trim(),
                description: scaleEditForm.description.trim(),
                value: Number(scaleEditForm.value) || 0,
            });

            if (!updated) {
                showMessage('error', 'No se pudo actualizar la escala.');
                return;
            }

            showMessage('success', 'Escala actualizada correctamente.');
            await loadScalesForCriterion(selectedCriterionId);
        } catch {
            showMessage('error', 'Error actualizando la escala.');
        } finally {
            setLoading(false);
        }
    };

    const copyScale = async () => {
        clearMessage();
        setCopyScaleMessage(null);

        if (!copyScaleSourceId) {
            showMessage('error', 'Selecciona la escala origen para copiar.');
            return;
        }

        if (!copyScaleTargetCriterionId) {
            showMessage('error', 'Selecciona el criterio destino para copiar la escala.');
            return;
        }

        setLoading(true);
        try {
            const copied = await rubricService.copyScaleToCriterion(copyScaleSourceId, copyScaleTargetCriterionId);
            if (!copied) {
                setCopyScaleMessage('No se pudo copiar la escala. Revisa que el valor no exista ya en el criterio destino.');
                showMessage('error', 'No se pudo copiar la escala.');
                return;
            }

            setCopyScaleMessage(`Escala copiada: ${copied.name}`);
            showMessage('success', `Escala copiada al criterio destino.`);
            await loadScalesForCriterion(copyScaleTargetCriterionId);
        } catch {
            setCopyScaleMessage('Error copiando la escala.');
            showMessage('error', 'Error copiando la escala.');
        } finally {
            setLoading(false);
        }
    };

    const publishSelectedRubric = async () => {
        clearMessage();
        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para publicarla.');
            return;
        }

        setLoading(true);
        try {
            const published = await rubricService.publishRubric(selectedRubricId);
            if (!published) {
                showMessage('error', 'No se pudo publicar la rúbrica. Revisa criterios y escalas.');
                return;
            }

            showMessage('success', 'Rúbrica publicada correctamente.');
            await loadRubrics();
        } catch {
            showMessage('error', 'Error publicando la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    const archiveSelectedRubric = async () => {
        clearMessage();
        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para archivarla.');
            return;
        }

        setLoading(true);
        try {
            const ok = await rubricService.archiveRubric(selectedRubricId);
            if (!ok) {
                showMessage('error', 'No se pudo archivar la rúbrica.');
                return;
            }

            showMessage('success', 'Rúbrica archivada correctamente.');
            await loadRubrics();
        } catch {
            showMessage('error', 'Error archivando la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    const deleteSelectedRubric = async () => {
        clearMessage();
        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para eliminarla.');
            return;
        }

        setLoading(true);
        try {
            const ok = await rubricService.deleteRubric(selectedRubricId);
            if (!ok) {
                showMessage('error', 'No se pudo eliminar la rúbrica.');
                return;
            }

            showMessage('success', 'Rúbrica eliminada correctamente.');
            setSelectedRubricId('');
            setSelectedCriterionId('');
            setCriteriaByRubric([]);
            setScalesByCriterion([]);
            await loadRubrics();
        } catch {
            showMessage('error', 'Error eliminando la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    const getRubricById = async () => {
        clearMessage();
        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para verla por ID.');
            return;
        }

        setLoading(true);
        try {
            const rubric = await rubricService.getRubricById(selectedRubricId);
            if (!rubric) {
                showMessage('error', 'No se encontró la rúbrica seleccionada.');
                return;
            }

            showMessage('info', `Rúbrica encontrada: ${rubric.title}`);
        } catch {
            showMessage('error', 'No se pudo cargar la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    const loadAssessments = async () => {
        setLoading(true);
        clearMessage();
        try {
            const data = await evaluationService.getEvaluations();
            setAssessments(data);
            if (!selectedAssessmentId && data.length > 0) {
                setSelectedAssessmentId(data[0].id ?? '');
            }
            showMessage('success', `Evaluaciones cargadas: ${data.length}`);
        } catch {
            showMessage('error', 'No se pudieron cargar las evaluaciones.');
        } finally {
            setLoading(false);
        }
    };

    const createAssessment = async () => {
        clearMessage();
        if (!assessmentForm.name.trim()) {
            showMessage('error', 'El nombre de la evaluación es requerido.');
            return;
        }

        setLoading(true);
        try {
            const newAssessment = await evaluationService.createEvaluation({
                name: assessmentForm.name.trim(),
                description: assessmentForm.description.trim(),
                subject_id: assessmentForm.subject_id.trim(),
                group_id: assessmentForm.group_id.trim(),
                weight: Number(assessmentForm.weight) || 1,
            });

            if (!newAssessment) {
                showMessage('error', 'No se pudo crear la evaluación.');
                return;
            }

            showMessage('success', 'Evaluación creada correctamente.');
            setAssessmentForm(initialAssessmentForm);
            await loadAssessments();
        } catch {
            showMessage('error', 'Error creando la evaluación.');
        } finally {
            setLoading(false);
        }
    };

    const updateAssessment = async () => {
        clearMessage();
        if (!selectedAssessmentId) {
            showMessage('error', 'Selecciona una evaluación para editarla.');
            return;
        }

        setLoading(true);
        try {
            const updated = await evaluationService.updateEvaluation(selectedAssessmentId, {
                name: assessmentEditForm.name.trim(),
                description: assessmentEditForm.description.trim(),
                subject_id: assessmentEditForm.subject_id.trim(),
                group_id: assessmentEditForm.group_id.trim(),
                weight: Number(assessmentEditForm.weight) || 1,
            });

            if (!updated) {
                showMessage('error', 'No se pudo actualizar la evaluación.');
                return;
            }

            showMessage('success', 'Evaluación actualizada correctamente.');
            await loadAssessments();
        } catch {
            showMessage('error', 'Error actualizando la evaluación.');
        } finally {
            setLoading(false);
        }
    };

    const associateRubricToAssessment = async () => {
        clearMessage();
        setAssociateRubricMessage(null);

        if (!selectedAssessmentId) {
            showMessage('error', 'Selecciona una evaluación para asociar una rúbrica.');
            return;
        }

        if (!selectedRubricId) {
            showMessage('error', 'Selecciona una rúbrica para asociar a la evaluación.');
            return;
        }

        setLoading(true);
        try {
            const result = await evaluationService.associateRubric(selectedAssessmentId, selectedRubricId);
            if (!result) {
                setAssociateRubricMessage('No se pudo asociar la rúbrica a la evaluación.');
                showMessage('error', 'No se pudo asociar la rúbrica.');
                return;
            }

            setAssociateRubricMessage(`Rúbrica asociada a evaluación: ${result.name}`);
            showMessage('success', 'Rúbrica asociada correctamente a la evaluación.');
            await loadAssessments();
        } catch {
            setAssociateRubricMessage('Error asociando la rúbrica a la evaluación.');
            showMessage('error', 'Error asociando la rúbrica.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    <h3 style={{ margin: 0 }}>🧪 Panel de pruebas de rúbricas</h3>
                    <p style={{ margin: '6px 0 0', color: '#5b6472' }}>
                        Crear rúbricas, agregar criterios, agregar escalas y probar publicar, archivar o eliminar.
                    </p>
                </div>
                <button onClick={loadRubrics} style={styles.primaryButton}>
                    Recargar datos
                </button>
            </header>

            {message && (
                <div style={{ ...styles.alert, ...alertStyles[message.type] }}>
                    {message.text}
                </div>
            )}

            <section style={styles.grid}>
                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>1. Rúbricas</h4>
                    <div style={styles.row}>
                        <input
                            placeholder="Título"
                            value={rubricForm.title}
                            onChange={e => setRubricForm(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <input
                            placeholder="Subject ID"
                            value={rubricForm.subject_id}
                            onChange={e => setRubricForm(prev => ({ ...prev, subject_id: e.target.value }))}
                        />
                    </div>
                    <textarea
                        placeholder="Descripción"
                        value={rubricForm.description}
                        onChange={e => setRubricForm(prev => ({ ...prev, description: e.target.value }))}
                        style={styles.textarea}
                    />
                    <div style={styles.row}>
                        <button onClick={createRubric} style={styles.primaryButton}>Crear rúbrica</button>
                        <button onClick={getRubricById} style={styles.secondaryButton}>Ver rúbrica seleccionada</button>
                    </div>
                </article>

                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>2. Selección y estado</h4>
                    <label style={styles.label}>Rúbrica seleccionada</label>
                    <select
                        value={selectedRubricId}
                        onChange={e => {
                            setSelectedRubricId(e.target.value);
                            setSelectedCriterionId('');
                        }}
                        style={styles.control}
                    >
                        <option value="">-- Seleccionar rúbrica --</option>
                        {rubrics.map(rubric => (
                            <option key={rubric.id} value={rubric.id}>
                                {rubric.title} ({rubric.subject_id})
                            </option>
                        ))}
                    </select>

                    {selectedRubric && (
                        <div style={styles.metaBox}>
                            <strong>{selectedRubric.title}</strong>
                            <div>Publicado: {selectedRubric.is_public ? 'Sí' : 'No'}</div>
                            <div>Archivado: {selectedRubric.is_archived ? 'Sí' : 'No'}</div>
                        </div>
                    )}

                    <div style={styles.row}>
                        <button onClick={publishSelectedRubric} style={styles.primaryButton}>Publicar</button>
                        <button onClick={archiveSelectedRubric} style={styles.warningButton}>Archivar</button>
                        <button onClick={deleteSelectedRubric} style={styles.dangerButton}>Eliminar</button>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0' }}>Editar rúbrica seleccionada</h5>
                        <div style={styles.row}>
                            <input
                                placeholder="Título"
                                value={rubricEditForm.title}
                                onChange={e => setRubricEditForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                            <input
                                placeholder="Materia"
                                value={rubricEditForm.subject_id}
                                onChange={e => setRubricEditForm(prev => ({ ...prev, subject_id: e.target.value }))}
                            />
                        </div>
                        <textarea
                            placeholder="Descripción"
                            value={rubricEditForm.description}
                            onChange={e => setRubricEditForm(prev => ({ ...prev, description: e.target.value }))}
                            style={styles.textarea}
                        />
                        <button onClick={updateRubric} style={styles.secondaryButton}>Actualizar rúbrica</button>
                    </div>
                </article>

                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>3. Criterios</h4>
                    <label style={styles.label}>Criterios de la rúbrica seleccionada</label>
                    <div style={styles.listBox}>
                        {criteriaByRubric.length === 0 ? (
                            <p style={styles.emptyText}>No hay criterios cargados.</p>
                        ) : (
                            criteriaByRubric.map(criterion => (
                                <button
                                    key={criterion.id}
                                    onClick={() => {
                                        setSelectedCriterionId(criterion.id);
                                        setSelectedScaleId('');
                                        setCopyScaleSourceId('');
                                    }}
                                    style={{
                                        ...styles.listItem,
                                        ...(selectedCriterionId === criterion.id ? styles.listItemActive : {}),
                                    }}
                                >
                                    <strong>{criterion.name}</strong>
                                    <span>peso: {criterion.weight}</span>
                                </button>
                            ))
                        )}
                    </div>

                    <div style={styles.row}>
                        <input
                            placeholder="Nombre del criterio"
                            value={criterionForm.name}
                            onChange={e => setCriterionForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                            placeholder="Peso"
                            type="number"
                            value={criterionForm.weight}
                            onChange={e => setCriterionForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                            style={{ width: 100 }}
                        />
                    </div>
                    <textarea
                        placeholder="Descripción del criterio"
                        value={criterionForm.description}
                        onChange={e => setCriterionForm(prev => ({ ...prev, description: e.target.value }))}
                        style={styles.textarea}
                    />
                    <button onClick={createCriterion} style={styles.primaryButton}>Crear criterio</button>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0' }}>Editar criterio seleccionado</h5>
                        <div style={styles.row}>
                            <input
                                placeholder="Nombre del criterio"
                                value={criterionEditForm.name}
                                onChange={e => setCriterionEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <input
                                placeholder="Peso"
                                type="number"
                                value={criterionEditForm.weight}
                                onChange={e => setCriterionEditForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                                style={{ width: 100 }}
                            />
                        </div>
                        <textarea
                            placeholder="Descripción del criterio"
                            value={criterionEditForm.description}
                            onChange={e => setCriterionEditForm(prev => ({ ...prev, description: e.target.value }))}
                            style={styles.textarea}
                        />
                        <button onClick={updateCriterion} style={styles.secondaryButton}>Actualizar criterio</button>
                    </div>
                </article>

                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>4. Validación de pesos</h4>
                    <div style={styles.metaBox}>
                        <strong>Total actual:</strong> {criteriaWeightTotal.toFixed(2)} / 100
                        <div>Restante disponible: {criteriaWeightRemaining.toFixed(2)}</div>
                        <div>Estado: {criteriaWeightTotal === 100 ? 'Listo para publicar' : criteriaWeightTotal > 100 ? 'Supera 100' : 'Aún faltan puntos para publicar'}</div>
                    </div>
                    <div style={styles.row}>
                        <button onClick={validateCriterionWeight} style={styles.primaryButton}>
                            Validar peso del criterio
                        </button>
                    </div>
                    {weightValidationMessage && <p style={{ marginTop: 8 }}>{weightValidationMessage}</p>}
                    <button onClick={() => selectedRubricId && loadCriteriaForRubric(selectedRubricId)} style={styles.secondaryButton}>
                        Recalcular pesos
                    </button>
                </article>

                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>5. Escalas</h4>
                    <label style={styles.label}>Escalas del criterio seleccionado</label>
                    <div style={styles.listBox}>
                        {scalesByCriterion.length === 0 ? (
                            <p style={styles.emptyText}>No hay escalas cargadas.</p>
                        ) : (
                            scalesByCriterion.map(scale => (
                                <button
                                    key={scale.id}
                                    onClick={() => setSelectedScaleId(scale.id)}
                                    style={{
                                        ...styles.listItem,
                                        ...(selectedScaleId === scale.id ? styles.listItemActive : {}),
                                        border: '1px solid #e2e8f0',
                                        width: '100%',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <strong>{scale.name}</strong>
                                    <span>valor: {scale.value}</span>
                                </button>
                            ))
                        )}
                    </div>

                    <div style={styles.row}>
                        <input
                            placeholder="Nombre de la escala"
                            value={scaleForm.name}
                            onChange={e => setScaleForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                            placeholder="Valor"
                            type="number"
                            value={scaleForm.value}
                            onChange={e => setScaleForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                            style={{ width: 100 }}
                        />
                    </div>
                    <textarea
                        placeholder="Descripción de la escala"
                        value={scaleForm.description}
                        onChange={e => setScaleForm(prev => ({ ...prev, description: e.target.value }))}
                        style={styles.textarea}
                    />
                    <button onClick={createScale} style={styles.primaryButton}>Crear escala</button>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0' }}>Editar escala seleccionada</h5>
                        <div style={styles.row}>
                            <input
                                placeholder="Nombre de la escala"
                                value={scaleEditForm.name}
                                onChange={e => setScaleEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <input
                                placeholder="Valor"
                                type="number"
                                value={scaleEditForm.value}
                                onChange={e => setScaleEditForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                                style={{ width: 100 }}
                            />
                        </div>
                        <textarea
                            placeholder="Descripción de la escala"
                            value={scaleEditForm.description}
                            onChange={e => setScaleEditForm(prev => ({ ...prev, description: e.target.value }))}
                            style={styles.textarea}
                        />
                        <button onClick={updateScale} style={styles.secondaryButton}>Actualizar escala</button>
                    </div>
                </article>

                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>6. Copiar escala</h4>
                    <label style={styles.label}>Escala origen</label>
                    <select
                        value={copyScaleSourceId}
                        onChange={e => setCopyScaleSourceId(e.target.value)}
                        style={styles.control}
                    >
                        <option value="">-- Seleccionar escala --</option>
                        {scalesByCriterion.map(scale => (
                            <option key={scale.id} value={scale.id}>
                                {scale.name} {scale.value !== undefined ? `(valor: ${scale.value})` : ''}
                            </option>
                        ))}
                    </select>

                    <label style={{ ...styles.label, marginTop: 12 }}>Criterio destino</label>
                    <select
                        value={copyScaleTargetCriterionId}
                        onChange={e => setCopyScaleTargetCriterionId(e.target.value)}
                        style={styles.control}
                    >
                        <option value="">-- Seleccionar criterio --</option>
                        {criteriaByRubric.map(criterion => (
                            <option key={criterion.id} value={criterion.id}>
                                {criterion.name}
                            </option>
                        ))}
                    </select>

                    <div style={styles.row}>
                        <button onClick={copyScale} style={styles.primaryButton}>Copiar escala</button>
                    </div>

                    {copyScaleMessage && <p style={{ marginTop: 8 }}>{copyScaleMessage}</p>}

                    {copyScaleSource && (
                        <div style={styles.metaBox}>
                            <strong>Origen:</strong> {copyScaleSource.name}
                            <div>Valor: {copyScaleSource.value ?? '-'}</div>
                        </div>
                    )}
                </article>

                <article style={styles.card}>
                    <h4 style={styles.cardTitle}>7. Evaluaciones y asociación de rúbricas</h4>
                    <div style={styles.row}>
                        <button onClick={loadAssessments} style={styles.primaryButton}>Cargar evaluaciones</button>
                    </div>

                    <label style={styles.label}>Evaluación seleccionada</label>
                    <select
                        value={selectedAssessmentId}
                        onChange={e => setSelectedAssessmentId(e.target.value)}
                        style={styles.control}
                    >
                        <option value="">-- Seleccionar evaluación --</option>
                        {assessments.map(assessment => (
                            <option key={assessment.id} value={assessment.id}>
                                {assessment.name} ({assessment.subject_id})
                            </option>
                        ))}
                    </select>

                    {selectedAssessment && (
                        <div style={styles.metaBox}>
                            <strong>{selectedAssessment.name}</strong>
                            <div>Rúbrica: {selectedAssessment.rubric_id ?? 'Sin asociar'}</div>
                            <div>Peso: {selectedAssessment.weight}</div>
                        </div>
                    )}

                    <div style={styles.row}>
                        <h5 style={{ margin: 0 }}>Crear evaluación</h5>
                    </div>
                    <div style={styles.row}>
                        <input
                            placeholder="Nombre de la evaluación"
                            value={assessmentForm.name}
                            onChange={e => setAssessmentForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <input
                            placeholder="Materia"
                            value={assessmentForm.subject_id}
                            onChange={e => setAssessmentForm(prev => ({ ...prev, subject_id: e.target.value }))}
                        />
                    </div>
                    <div style={styles.row}>
                        <input
                            placeholder="Grupo"
                            value={assessmentForm.group_id}
                            onChange={e => setAssessmentForm(prev => ({ ...prev, group_id: e.target.value }))}
                        />
                        <input
                            placeholder="Peso"
                            type="number"
                            value={assessmentForm.weight}
                            onChange={e => setAssessmentForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                            style={{ width: 100 }}
                        />
                    </div>
                    <textarea
                        placeholder="Descripción"
                        value={assessmentForm.description}
                        onChange={e => setAssessmentForm(prev => ({ ...prev, description: e.target.value }))}
                        style={styles.textarea}
                    />
                    <button onClick={createAssessment} style={styles.primaryButton}>Crear evaluación</button>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0' }}>Editar evaluación seleccionada</h5>
                        <div style={styles.row}>
                            <input
                                placeholder="Nombre"
                                value={assessmentEditForm.name}
                                onChange={e => setAssessmentEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <input
                                placeholder="Materia"
                                value={assessmentEditForm.subject_id}
                                onChange={e => setAssessmentEditForm(prev => ({ ...prev, subject_id: e.target.value }))}
                            />
                        </div>
                        <div style={styles.row}>
                            <input
                                placeholder="Grupo"
                                value={assessmentEditForm.group_id}
                                onChange={e => setAssessmentEditForm(prev => ({ ...prev, group_id: e.target.value }))}
                            />
                            <input
                                placeholder="Peso"
                                type="number"
                                value={assessmentEditForm.weight}
                                onChange={e => setAssessmentEditForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                                style={{ width: 100 }}
                            />
                        </div>
                        <textarea
                            placeholder="Descripción"
                            value={assessmentEditForm.description}
                            onChange={e => setAssessmentEditForm(prev => ({ ...prev, description: e.target.value }))}
                            style={styles.textarea}
                        />
                        <button onClick={updateAssessment} style={styles.secondaryButton}>Actualizar evaluación</button>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 8px 0' }}>Asociar rúbrica a evaluación</h5>
                        <div style={styles.row}>
                            <button onClick={associateRubricToAssessment} style={styles.primaryButton}>
                                Asociar rúbrica seleccionada
                            </button>
                        </div>
                        {associateRubricMessage && <p style={{ marginTop: 8 }}>{associateRubricMessage}</p>}
                        {selectedRubric && selectedAssessment && (
                            <div style={styles.metaBox}>
                                <strong>Operación:</strong> {selectedAssessment.name} → {selectedRubric.title}
                            </div>
                        )}
                    </div>
                </article>

                <article style={styles.cardWide}>
                    <h4 style={styles.cardTitle}>8. Rúbricas cargadas</h4>
                    {rubrics.length === 0 ? (
                        <p style={styles.emptyText}>No hay rúbricas creadas aún.</p>
                    ) : (
                        <div style={styles.listBox}>
                            {rubrics.map((rubric, index) => (
                                <div key={rubric.id ?? `${rubric.title}-${index}`} style={styles.listRow}>
                                    <div>
                                        <strong>{rubric.title}</strong>
                                        <div style={styles.muted}>{rubric.subject_id}</div>
                                    </div>
                                    <div style={styles.muted}>{rubric.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>

            {loading && <p style={styles.loadingText}>Procesando...</p>}
        </div>
    );
};

const styles: Record<string, CSSProperties> = {
    page: {
        padding: '20px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
        borderRadius: 12,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: 16,
    },
    card: {
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)',
    },
    cardWide: {
        gridColumn: '1 / -1',
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)',
    },
    cardTitle: {
        margin: '0 0 12px',
    },
    row: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10,
    },
    label: {
        display: 'block',
        marginBottom: 6,
        fontSize: 13,
        color: '#475569',
    },
    control: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #cbd5e1',
        background: '#fff',
    },
    textarea: {
        width: '100%',
        minHeight: 70,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #cbd5e1',
        marginTop: 10,
        resize: 'vertical',
    },
    primaryButton: {
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        background: '#0f172a',
        color: '#fff',
        cursor: 'pointer',
    },
    secondaryButton: {
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #94a3b8',
        background: '#fff',
        color: '#0f172a',
        cursor: 'pointer',
    },
    warningButton: {
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        background: '#f59e0b',
        color: '#111827',
        cursor: 'pointer',
    },
    dangerButton: {
        padding: '10px 14px',
        borderRadius: 10,
        border: 'none',
        background: '#ef4444',
        color: '#fff',
        cursor: 'pointer',
    },
    alert: {
        padding: '10px 12px',
        borderRadius: 10,
        marginBottom: 16,
        fontWeight: 600,
    },
    listBox: {
        display: 'grid',
        gap: 8,
        marginTop: 10,
        marginBottom: 10,
    },
    listItem: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        cursor: 'pointer',
        textAlign: 'left',
    },
    listItemActive: {
        borderColor: '#0f172a',
        background: '#e2e8f0',
    },
    listRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
    },
    metaBox: {
        marginTop: 10,
        padding: 12,
        borderRadius: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
    },
    pre: {
        marginTop: 10,
        padding: 12,
        borderRadius: 10,
        background: '#0f172a',
        color: '#e2e8f0',
        overflowX: 'auto',
        fontSize: 12,
    },
    loadingText: {
        marginTop: 16,
        color: '#334155',
    },
    muted: {
        color: '#64748b',
        fontSize: 13,
    },
    emptyText: {
        color: '#64748b',
        margin: 0,
    },
};

const alertStyles: Record<ResultMessage['type'], CSSProperties> = {
    success: {
        background: '#dcfce7',
        color: '#166534',
        border: '1px solid #86efac',
    },
    error: {
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5',
    },
    info: {
        background: '#dbeafe',
        color: '#1e3a8a',
        border: '1px solid #93c5fd',
    },
};

export default Tests;
