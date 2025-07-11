// src/components/alumnos/ListaAlumnos.jsx
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

export default function ListaAlumnos() {
  const { user } = useContext(AuthContext);
  const isAdmin = user.tipo === 'admin';

  const [alumnos, setAlumnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(() => {
    const stored = localStorage.getItem('expandedAlumno');
    return stored ? Number(stored) : null;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [page, setPage] = useState(() => {
    const stored = localStorage.getItem('alumnosPage');
    return stored ? Number(stored) : 0;
  });
  const [pageSize, setPageSize] = useState(5);

  // Persist expandedRow
  useEffect(() => {
    if (expandedRow === null) localStorage.removeItem('expandedAlumno');
    else localStorage.setItem('expandedAlumno', expandedRow);
  }, [expandedRow]);

  // Persist page
  useEffect(() => {
    localStorage.setItem('alumnosPage', page);
  }, [page]);

  // Handle resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fetch alumnos
  useEffect(() => {
    API.get('/alumnos')
      .then(({ data }) => setAlumnos(data))
      .catch(err => console.error(err));
  }, []);

  // Delete alumno
  const handleDelete = async id => {
    if (!window.confirm('¿Estás seguro de eliminar este alumno?')) return;
    await API.delete(`/alumnos/${id}`);
    const { data } = await API.get('/alumnos');
    setAlumnos(data);
  };

  // Format date
  const formatDate = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  // Toggle single expanded row
  const toggleRow = id => setExpandedRow(prev => (prev === id ? null : id));

  // Filter
  const filtered = alumnos.filter(a =>
    a.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.curp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // Render group label
  const renderGroupLabel = a =>
    a.id_grupo ? `${a.grado_grupo} — ${a.grupo}` : 'Sin asignar';

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filtered.map(a => ({
      'Nombre completo': a.nombre_completo,
      CURP: a.curp,
      Institución: a.institucion,
      'Profesor (Grupo)': a.profesor_grupo || '—',
      Género: a.genero,
      Grupo: renderGroupLabel(a),
      'F. Nacimiento': formatDate(a.fecha_nacimiento),
      Edad: a.edad_calculada,
      'F. Inscripción': formatDate(a.fecha_inscripcion),
      Promovido: a.promovido ? 'Sí' : 'No',
      Activo: a.activo ? 'Sí' : 'No',
      Diagnóstico: a.diagnostico_medico,
      Medicamentos: a.medicamentos,
      Alergias: a.alergias,
      Observaciones: a.observaciones,
      'Padre/Tutor': a.padre_tutor,
      'Contacto Emergencia': a.contacto_emergencia,
      Domicilio: a.domicilio,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'alumnos.xlsx');
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.text('Lista de Alumnos', 14, 12);
    autoTable(doc, {
      head: [[
        'Nombre','CURP','Grupo','Edad',
        'Profesor (Grupo)','Diagnóstico',
        'Padre/Tutor','Contacto','Activo'
      ]],
      body: filtered.map(a => [
        a.nombre_completo,
        a.curp,
        renderGroupLabel(a),
        a.edad_calculada,
        a.profesor_grupo || '—',
        a.diagnostico_medico,
        a.padre_tutor,
        a.contacto_emergencia,
        a.activo ? 'Sí' : 'No'
      ]),
      startY: 18,
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [29,97,168], textColor: 255 }
    });
    doc.save('alumnos.pdf');
  };

  return (
    <div className="table-wrapper" style={{ paddingTop: 38 }}>
      <h2>Alumnos</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        {isAdmin && <Link to="/alumnos/nuevo" className="link-button">+ Nuevo alumno</Link>}
        {isAdmin && <button className="button" onClick={handleExportExcel}>Exportar Excel</button>}
        <button className="button" onClick={handleExportPDF}>Exportar PDF</button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o CURP..."
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
        style={{
          width: '100%',
          padding: 8,
          margin: '12px 0',
          border: '1px solid #ccc',
          borderRadius: 4
        }}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>
          Registros por página:
          <select
            value={pageSize}
            onChange={e => { setPageSize(+e.target.value); setPage(0); }}
            style={{ marginLeft: 8 }}
          >
            {[5,8,10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {/* Mobile view */}
      {isMobile ? (
        <div className="card-list">
          {paged.map(a => (
            <div key={a.id_alumno} className="card">
              <div className="card-header">
                <div><strong>Nombre:</strong> {a.nombre_completo}</div>
                <div><strong>CURP:</strong> {a.curp}</div>
                <div><strong>Grupo:</strong> {renderGroupLabel(a)}</div>
              </div>
              <div className="card-actions">
                {isAdmin ? (
                  <>
                    <Link to={`/alumnos/${a.id_alumno}`} className="button">Editar</Link>
                    <button className="button delete" onClick={() => handleDelete(a.id_alumno)}>Borrar</button>
                  </>
                ) : (
                  <em>Sin permisos</em>
                )}
                <button className="button" onClick={() => toggleRow(a.id_alumno)}>
                  {expandedRow === a.id_alumno ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              </div>
              {expandedRow === a.id_alumno && (
                <div className="card-details">
                  <div><strong>Institución:</strong> {a.institucion}</div>
                  <div><strong>Profesor (Grupo):</strong> {a.profesor_grupo || '—'}</div>
                  <div><strong>Género:</strong> {a.genero}</div>
                  <div><strong>Grupo:</strong> {renderGroupLabel(a)}</div>
                  <div><strong>F. Nacimiento:</strong> {formatDate(a.fecha_nacimiento)}</div>
                  <div><strong>Edad:</strong> {a.edad_calculada}</div>
                  <div><strong>F. Inscripción:</strong> {formatDate(a.fecha_inscripcion)}</div>
                  <div><strong>Promovido:</strong> {a.promovido ? 'Sí' : 'No'}</div>
                  <div><strong>Activo:</strong> {a.activo ? 'Sí' : 'No'}</div>
                  <div><strong>Diagnóstico:</strong> {a.diagnostico_medico}</div>
                  <div><strong>Medicamentos:</strong> {a.medicamentos}</div>
                  <div><strong>Alergias:</strong> {a.alergias}</div>
                  <div><strong>Observaciones:</strong> {a.observaciones}</div>
                  <div><strong>Padre/Tutor:</strong> {a.padre_tutor}</div>
                  <div><strong>Contacto Emergencia:</strong> {a.contacto_emergencia}</div>
                  <div><strong>Domicilio:</strong> {a.domicilio}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop view */
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>CURP</th>
              <th>Grupo</th>
              <th>Acciones</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(a => (
              <Fragment key={a.id_alumno}>
                <tr>
                  <td>{a.nombre_completo}</td>
                  <td>{a.curp}</td>
                  <td>{renderGroupLabel(a)}</td>
                  <td>
                    {isAdmin ? (
                      <>
                        <Link to={`/alumnos/${a.id_alumno}`} className="button">Editar</Link>
                        <button className="button delete" onClick={() => handleDelete(a.id_alumno)}>Borrar</button>
                      </>
                    ) : (
                      <em>Sin permisos</em>
                    )}
                  </td>
                  <td>
                    <button className="button" onClick={() => toggleRow(a.id_alumno)}>
                      {expandedRow === a.id_alumno ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
                {expandedRow === a.id_alumno && (
                  <tr>
                    <td colSpan={5} style={{ background: '#f9f9f9', padding: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><strong>Institución:</strong> {a.institucion}</div>
                        <div><strong>Profesor (Grupo):</strong> {a.profesor_grupo || '—'}</div>
                        <div><strong>Género:</strong> {a.genero}</div>
                        <div><strong>Grupo:</strong> {renderGroupLabel(a)}</div>
                        <div><strong>F. Nacimiento:</strong> {formatDate(a.fecha_nacimiento)}</div>
                        <div><strong>Edad:</strong> {a.edad_calculada}</div>
                        <div><strong>F. Inscripción:</strong> {formatDate(a.fecha_inscripcion)}</div>
                        <div><strong>Promovido:</strong> {a.promovido ? 'Sí' : 'No'}</div>
                        <div><strong>Activo:</strong> {a.activo ? 'Sí' : 'No'}</div>
                        <div><strong>Diagnóstico:</strong> {a.diagnostico_medico}</div>
                        <div><strong>Medicamentos:</strong> {a.medicamentos}</div>
                        <div><strong>Alergias:</strong> {a.alergias}</div>
                        <div><strong>Observaciones:</strong> {a.observaciones}</div>
                        <div><strong>Padre/Tutor:</strong> {a.padre_tutor}</div>
                        <div><strong>Contacto Emergencia:</strong> {a.contacto_emergencia}</div>
                        <div><strong>Domicilio:</strong> {a.domicilio}</div>
                      </div>
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
