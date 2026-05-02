import Tests from '../components/Tests';

// Página para evaluar el funcionamiento de la gestión de rúbricas
const EvaluationPage = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <h1>Sistema de Evaluación</h1>
        <p>Prueba de conexión HU-08 a HU-14</p>
      </header>
      
      <section>
        <h2>Gestión de Rúbricas</h2>
        <Tests/> 
      </section>
    </div>
  );
};

export default EvaluationPage;