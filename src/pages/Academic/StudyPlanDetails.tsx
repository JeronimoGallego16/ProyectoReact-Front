import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import TableScroll from '../../components/TableScroll';
import GenericTable from '../../components/GenericTable';
import { studyPlanService } from '../../services/StudyPlanService';
import { studyPlanSubjectService } from '../../services/StudyPlanSubjectService';
import { careerService } from '../../services/CareerService';
import { StudyPlan, StudyPlanSubjectDetail } from '../../models/StudyPlan';
import { showToast } from '../../hooks/fireToast';

const STUDY_PLAN_SUBJECTS_COLUMNS = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'credits', label: 'Créditos' },
];

const StudyPlanDetailsPage: React.FC = () => {
  const { studyPlanId } = useParams<{ studyPlanId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [subjects, setSubjects] = useState<StudyPlanSubjectDetail[]>([]);
  const [careerName, setCareerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!studyPlanId) return;
      setLoading(true);
      try {
        const p = await studyPlanService.getStudyPlanById(studyPlanId);
        setPlan(p);
          if (p) {
          const s = await studyPlanSubjectService.getSubjectsByStudyPlan(p.id);
          setSubjects(s);
          try {
            const career = await careerService.getCareerById(p.career_id);
            setCareerName(career?.name ?? null);
          } catch (err) {
            setCareerName(null);
          }
        }
      } catch (error) {
        showToast('Error', 'No se pudo cargar el plan de estudios', 2);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [studyPlanId]);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <PageHeader
        title={plan ? `Plan de estudios — Versión ${plan.year}` : 'Plan de estudios'}
        description="Detalles del plan de estudios"
        primaryAction={{ label: 'Volver', onClick: () => navigate('/academic/study-plans') }}
      />

      {loading ? (
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-sm text-body dark:text-bodydark">Cargando…</p>
        </div>
      ) : !plan ? (
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-sm text-body dark:text-bodydark">Plan no encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-body dark:text-bodydark">Carrera</p>
                  <p className="text-sm text-black dark:text-white">{careerName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-body dark:text-bodydark">Año (versión)</p>
                  <p className="text-sm text-black dark:text-white">{plan.year}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-body dark:text-bodydark">Estado</p>
                  <p className="text-sm text-black dark:text-white">
                    {plan.is_published ? (
                      <span className="inline-block rounded bg-green-1 px-2 py-1 text-xs text-green">Publicado</span>
                    ) : (
                      <span className="inline-block rounded bg-yellow-1 px-2 py-1 text-xs text-yellow">Borrador</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-body dark:text-bodydark">Total asignaturas</p>
                  <p className="text-sm text-black dark:text-white">{subjects.length}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-body dark:text-bodydark">Total créditos</p>
                  <p className="text-sm text-black dark:text-white">{subjects.reduce((s, x) => s + x.credits, 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-body dark:text-bodydark">Última actualización</p>
                  <p className="text-xs text-body dark:text-bodydark">{plan.updated_at ? new Date(plan.updated_at).toLocaleString() : '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-4 py-6 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">Asignaturas vinculadas</h3>
              </div>
              <TableScroll maxHeight="60vh">
                {subjects.length === 0 ? (
                  <div className="p-6 text-center text-sm text-body dark:text-bodydark">No hay asignaturas vinculadas al plan.</div>
                ) : (
                  <GenericTable data={subjects} columns={STUDY_PLAN_SUBJECTS_COLUMNS} actions={[]} onAction={() => {}} />
                )}
              </TableScroll>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanDetailsPage;
