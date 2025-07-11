// src/components/grupos/GruposPorProfesor.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/responsive.css';

export default function GruposPorProfesor() {
  const [profesores, setProfesores] = useState([]);
  const [selectedId, setSelectedId] = useState(() => {
    // Carga inicial desde localStorage (o '' si no existe)
    return localStorage.getItem('gruposPorProfesorId') || '';
  });
  const [grupos, setGrupos]         = useState([]);
  const [loadingId, setLoadingId]   = useState(null);
  const [modalUrl, setModalUrl]     = useState('');
  const [isMobile, setIsMobile]     = useState(window.innerWidth < 600);

  // Mantener selectedId en localStorage
  useEffect(() => {
    if (selectedId) {
      localStorage.setItem('gruposPorProfesorId', selectedId);
    }
  }, [selectedId]);

  // Detectar móvil
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cargo lista de profesores
  useEffect(() => {
    API.get('/personal/profesores')
      .then(({ data }) => setProfesores(data))
      .catch(() => alert('Error cargando profesores logeate para tener acceso'));
  }, []);

  // Cargo grupos cuando cambia selectedId
  useEffect(() => {
    if (!selectedId) {
      setGrupos([]);
      return;
    }
    API.get(`/grupos/profesor/${selectedId}`)
      .then(({ data }) => setGrupos(data))
      .catch(() => alert('Error cargando grupos'));
  }, [selectedId]);

  // Función genérica para crear el PDF
  const makePDF = async group => {
    const { data: alumnos } = await API.get(`/grupos/${group.id_grupo}/alumnos`);
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(`Grupo ${group.grado} — ${group.grupo}`, 14, 12);
    autoTable(doc, {
      head: [[
        'Nombre','Edad','Padre/Tutor','Domicilio',
        'Contacto Emergencia','Diagnóstico Médico',
        'Medicamentos','Alergias','Observaciones'
      ]],
      body: alumnos.map(a => [
        a.nombre_completo,
        a.edad_calculada,
        a.padre_tutor,
        a.domicilio,
        a.contacto_emergencia,
        a.diagnostico_medico,
        a.medicamentos,
        a.alergias,
        a.observaciones
      ]),
      startY: 18,
      styles: { fontSize: 8, cellPadding: 1 }
    });
    return doc;
  };

  // Ver PDF (modal en desktop, navegación en móvil)
  const viewPDF = async group => {
    setLoadingId(group.id_grupo);
    try {
      const doc = await makePDF(group);
      const url = doc.output('bloburl');
      if (isMobile) {
        window.location.href = url;
      } else {
        setModalUrl(url);
      }
    } catch {
      alert('Error generando vista previa');
    } finally {
      setLoadingId(null);
    }
  };

  // Descargar PDF
  const downloadPDF = async group => {
    setLoadingId(group.id_grupo);
    try {
      const doc = await makePDF(group);
      doc.save(`Grupo_${group.grado}_${group.grupo}.pdf`);
    } catch {
      alert('Error descargando PDF');
    } finally {
      setLoadingId(null);
    }
  };

  const closeModal = () => setModalUrl('');

  return (
    <div className="table-wrapper" style={{ padding:20, maxWidth:600, margin:'2rem auto' }}>
      <h2>Grupos por Profesor</h2>

      <div style={{ marginBottom:16 }}>
        <label>Profesor</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{ width:'100%', padding:8, fontSize:16 }}
        >
          <option value="">— Selecciona profesor —</option>
          {profesores.map(p => (
            <option key={p.id_personal} value={p.id_personal}>
              {p.nombre_completo}
            </option>
          ))}
        </select>
      </div>

      {selectedId && (
        grupos.length > 0 ? (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Grado</th>
                <th>Ciclo escolar</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map(g => (
                <tr key={g.id_grupo}>
                  <td>{g.grupo}</td>
                  <td>{g.grado}</td>
                  <td>{g.ciclo_escolar || '—'}</td>
                  <td>
                    <button
                      onClick={() => viewPDF(g)}
                      className={`button small ver-pdf ${loadingId===g.id_grupo?'loading':''}`}
                      disabled={loadingId===g.id_grupo}
                    >
                      <span className="icon">📄</span>
                      {loadingId===g.id_grupo ? ' Cargando...' : ' Ver PDF'}
                    </button>
                    {' '}
                    <button
                      onClick={() => downloadPDF(g)}
                      className={`button small ver-pdf ${loadingId===g.id_grupo?'loading':''}`}
                      disabled={loadingId===g.id_grupo}
                    >
                      <span className="icon">⬇️</span>
                      {loadingId===g.id_grupo ? ' Cargando...' : ' Descargar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay grupos asignados a este profesor.</p>
        )
      )}

      {/* Modal sólo en desktop */}
      {modalUrl && !isMobile && (
        <>
          <div className="pdf-backdrop" onClick={closeModal}/>
          <div className="pdf-modal">
            <button onClick={closeModal} style={{ position:'absolute', top:8, right:8 }}>✕</button>
            <iframe src={modalUrl} title="Previsualización PDF"/>
          </div>
        </>
      )}
    </div>
  );
}
