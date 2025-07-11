// src/components/grupos/ListaGrupos.jsx
import React, { useEffect, useState, useContext, Fragment } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from '../../components/common/Pagination';
import '../../styles/responsive.css';

// orden fijo de niveles
const gradeOrder = ['Primero', 'segundo', 'tercero', 'cuarto'];

export default function ListaGrupos() {
  const { user } = useContext(AuthContext);
  const isAdmin = user.tipo === 'admin';

  const [grupos, setGrupos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // página persistida
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('gruposPage');
    return saved ? Number(saved) : 0;
  });
  const [pageSize, setPageSize] = useState(5);

  // grupo expandido persistido
  const [expandedRow, setExpandedRow] = useState(() => {
    const saved = localStorage.getItem('gruposExpandedRow');
    return saved ? Number(saved) : null;
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [alumnosPorGrupo, setAlumnosPorGrupo] = useState({});

  // persistimos página
  useEffect(() => {
    localStorage.setItem('gruposPage', page);
  }, [page]);

  // persistimos grupo expandido
  useEffect(() => {
    if (expandedRow === null) {
      localStorage.removeItem('gruposExpandedRow');
    } else {
      localStorage.setItem('gruposExpandedRow', expandedRow);
    }
  }, [expandedRow]);

  // responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // carga, filtra, ordena y enriquece con nombre de profesor
  useEffect(() => {
    async function fetchAndEnrich() {
      try {
        const { data: gruposRaw } = await API.get('/grupos');
        const { data: allPersonal } = await API.get('/personal');
        const profMap = {};
        allPersonal.forEach(p => { profMap[p.id_personal] = p.nombre_completo; });

        const possibleKeys = ['id_profesor', 'profesor_grupo', 'id_profesor_grupo'];
        const profKey = gruposRaw.length
          ? possibleKeys.find(k => k in gruposRaw[0])
          : null;

        const filtered = gruposRaw.filter(g =>
          g.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.grado.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const sorted = filtered.sort((a, b) => {
          const ia = gradeOrder.indexOf(a.grado);
          const ib = gradeOrder.indexOf(b.grado);
          if (ia !== ib) return ia - ib;
          return a.grupo.localeCompare(b.grupo);
        });

        const enriched = sorted.map(g => {
          if (g.profesor) {
            return { ...g, profesor_nombre: g.profesor };
          }
          if (profKey && profMap[g[profKey]]) {
            return { ...g, profesor_nombre: profMap[g[profKey]] };
          }
          return { ...g, profesor_nombre: null };
        });

        setGrupos(enriched);
      } catch {
        alert('Error cargando la lista de grupos');
      }
    }
    fetchAndEnrich();
  }, [searchTerm]);

// Borrar grupo
const handleDelete = async id => {
  if (!window.confirm('¿Seguro quieres borrar este grupo?')) return;
  try {
    await API.delete(`/grupos/${id}`);
    // Eliminamos de golpe el grupo de nuestro estado
    setGrupos(prev => prev.filter(g => g.id_grupo !== id));
    // Si además el grupo borrado estaba expandido, lo cerramos:
    if (expandedRow === id) {
      setExpandedRow(null);
      localStorage.removeItem('gruposExpandedRow');
    }
  } catch (err) {
    alert(err.response?.data?.mensaje || 'Error eliminando grupo');
  }
};

  // toggle detalle de un solo grupo
  const toggleAlumnos = async id => {
    if (!alumnosPorGrupo[id]) {
      try {
        const { data } = await API.get(`/grupos/${id}/alumnos`);
        setAlumnosPorGrupo(prev => ({ ...prev, [id]: data }));
      } catch {
        alert('Error cargando alumnos');
        return;
      }
    }
    setExpandedRow(prev => prev === id ? null : id);
  };

  // export Excel (con nombres corregidos)
  const exportGroupExcel = async id => {
    try {
      const [{ data: grupo }, { data: alumnos }] = await Promise.all([
        API.get(`/grupos/${id}`),
        API.get(`/grupos/${id}/alumnos`)
      ]);
      const rows = alumnos.map(a => ({
        'Grado y Grupo': `${grupo.grado_descripcion} - ${grupo.nombre_grupo}`,
        'Ciclo escolar': grupo.ciclo_escolar || '',
        Profesor: grupo.profesor_nombre || 'Sin asignar',
        Nombre: a.nombre_completo,
        Edad: a.edad_calculada,
        'Padre/Tutor': a.padre_tutor,
        Domicilio: a.domicilio,
        'Contacto Emergencia': a.contacto_emergencia,
        'Diagnóstico Médico': a.diagnostico_medico,
        Medicamentos: a.medicamentos,
        Alergias: a.alergias,
        Observaciones: a.observaciones
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf]), `Grupo_${grupo.grado_descripcion}_${grupo.nombre_grupo}.xlsx`);
    } catch {
      alert('Error exportando a Excel');
    }
  };

  // export PDF (igual)
  const exportGroupPDF = async id => {
    try {
      const [{ data: grupo }, { data: alumnos }] = await Promise.all([
        API.get(`/grupos/${id}`),
        API.get(`/grupos/${id}/alumnos`)
      ]);
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.text(`Grupo ${grupo.grado_descripcion} — ${grupo.nombre_grupo}`, 14, 12);
      autoTable(doc, {
        head: [[
          '#','Nombre','Edad','Padre/Tutor','Domicilio',
          'Contacto Emergencia','Diagnóstico Médico','Medicamentos','Alergias','Observaciones'
        ]],
        body: alumnos.map((a, i) => [
          i + 1,
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
      doc.save(`Grupo_${grupo.grado_descripcion}_${grupo.nombre_grupo}.pdf`);
    } catch {
      alert('Error exportando a PDF');
    }
  };

  // renderización
  const totalPages = Math.max(1, Math.ceil(grupos.length / pageSize));
  const paged = grupos.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="table-wrapper" style={{ paddingTop: 38 }}>
      <h2>Grupos</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {isAdmin && <Link to="/grupos/nuevo" className="link-button">+ Nuevo Grupo</Link>}
        <input
          type="text"
          placeholder="Buscar por grupo o grado..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <label>
          Registros:
          <select
            value={pageSize}
            onChange={e => { setPageSize(+e.target.value); setPage(0); }}
            style={{ marginLeft: 8 }}
          >
            {[5, 8, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {isMobile ? (
        <div className="card-list">
          {paged.map(g => (
            <div key={g.id_grupo} className="card">
              <div className="card-header">
                <div><strong>Grupo:</strong> {g.grado} – {g.grupo}</div>
                <div><strong>Ciclo:</strong> {g.ciclo_escolar || '—'}</div>
                <div><strong>Profesor:</strong> {g.profesor_nombre || 'Sin asignar'}</div>
              </div>
              <div className="card-actions">
                {isAdmin && (
                  <>
                    <Link to={`/grupos/${g.id_grupo}`} className="button">Editar</Link>
                    <button className="button delete" onClick={() => handleDelete(g.id_grupo)}>Borrar</button>
                  </>
                )}
                <button className="button" onClick={() => exportGroupExcel(g.id_grupo)}>Excel</button>
                <button className="button" onClick={() => exportGroupPDF(g.id_grupo)}>PDF</button>
                <button className="button" onClick={() => toggleAlumnos(g.id_grupo)}>
                  {expandedRow === g.id_grupo ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {expandedRow === g.id_grupo && (
                <div className="card-details" style={{ marginTop: 8 }}>
                  {(alumnosPorGrupo[g.id_grupo] || []).length > 0 ? (
                    <ul style={{ paddingLeft: 16 }}>
                      {alumnosPorGrupo[g.id_grupo].map(a => (
                        <li key={a.id_alumno}>
                          <strong>{a.nombre_completo}</strong> — {a.edad_calculada} años<br/>
                          <em>Padre/Tutor:</em> {a.padre_tutor}<br/>
                          <em>Domicilio:</em> {a.domicilio}<br/>
                          <em>Contacto Emergencia:</em> {a.contacto_emergencia}<br/>
                          <em>Diagnóstico Médico:</em> {a.diagnostico_medico}<br/>
                          <em>Medicamentos:</em> {a.medicamentos}<br/>
                          <em>Alergias:</em> {a.alergias}<br/>
                          <em>Observaciones:</em> {a.observaciones}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontStyle: 'italic' }}>No hay alumnos asignados.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Grado y Grupo</th>
              <th>Ciclo escolar</th>
              <th>Profesor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(g => (
              <Fragment key={g.id_grupo}>
                <tr>
                  <td>{g.grado} – {g.grupo}</td>
                  <td>{g.ciclo_escolar || '—'}</td>
                  <td>{g.profesor_nombre || 'Sin asignar'}</td>
                  <td>
                    {isAdmin && (
                      <>
                        <Link to={`/grupos/${g.id_grupo}`} className="button">Editar</Link>{' '}
                        <button className="button delete" onClick={() => handleDelete(g.id_grupo)}>Borrar</button>{' '}
                      </>
                    )}
                    <button className="button" onClick={() => exportGroupExcel(g.id_grupo)}>Excel</button>{' '}
                    <button className="button" onClick={() => exportGroupPDF(g.id_grupo)}>PDF</button>{' '}
                    <button className="button" onClick={() => toggleAlumnos(g.id_grupo)}>
                      {expandedRow === g.id_grupo ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
                {expandedRow === g.id_grupo && (
                  <tr>
                    <td colSpan={4} style={{ background: '#f9f9f9', padding: 0 }}>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>#</th><th>Nombre</th><th>Edad</th><th>Padre/Tutor</th>
                            <th>Domicilio</th><th>Contacto</th><th>Diagnóstico</th>
                            <th>Medicamentos</th><th>Alergias</th><th>Observaciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(alumnosPorGrupo[g.id_grupo] || []).map((a, i) => (
                            <tr key={a.id_alumno}>
                              <td>{i + 1}</td>
                              <td>{a.nombre_completo}</td>
                              <td>{a.edad_calculada}</td>
                              <td>{a.padre_tutor}</td>
                              <td>{a.domicilio}</td>
                              <td>{a.contacto_emergencia}</td>
                              <td>{a.diagnostico_medico}</td>
                              <td>{a.medicamentos}</td>
                              <td>{a.alergias}</td>
                              <td>{a.observaciones}</td>
                            </tr>
                          ))}
                          {alumnosPorGrupo[g.id_grupo]?.length === 0 && (
                            <tr>
                              <td colSpan={10} style={{ textAlign: 'center', padding: 8 }}>
                                No hay alumnos asignados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
