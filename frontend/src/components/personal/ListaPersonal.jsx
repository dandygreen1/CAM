// src/components/alumnos/ListaPersonal.jsx
import React, { useEffect, useState, useContext, Fragment } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Pagination from '../../components/common/Pagination';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/responsive.css';

export default function ListaPersonal() {
  const { user } = useContext(AuthContext);
  const isAdmin = user.tipo === 'admin';

  const [personal, setPersonal] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fila expandida única, persistida
  const [expandedRow, setExpandedRow] = useState(() => {
    const stored = localStorage.getItem('expandedPersonalRow');
    return stored ? Number(stored) : null;
  });

  // Página actual, persistida
  const [currentPage, setCurrentPage] = useState(() => {
    const stored = localStorage.getItem('personalPage');
    return stored ? Number(stored) : 0;
  });

  const [pageSize, setPageSize] = useState(5);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  // Persistir
  useEffect(() => {
    if (expandedRow === null) localStorage.removeItem('expandedPersonalRow');
    else localStorage.setItem('expandedPersonalRow', expandedRow);
  }, [expandedRow]);

  useEffect(() => {
    localStorage.setItem('personalPage', currentPage);
  }, [currentPage]);

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Cargar datos
  useEffect(() => { fetchPersonal(); }, []);
  const fetchPersonal = async () => {
    try {
      const { data } = await API.get('/personal');
      const sorted = data.sort((a, b) =>
        new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso)
      );
      setPersonal(sorted);
      // no tocamos currentPage, lo mantenemos
    } catch (err) {
      console.error('Error al cargar personal:', err);
      if (err.response?.status === 403) {
        alert('No tienes permisos para ver la lista de personal o tu sesión ha expirado.');
      } else {
        alert('Ocurrió un error cargando la lista de personal.');
      }
    }
  };

  // Eliminar
  const handleDelete = async id => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await API.delete(`/personal/${id}`);
      await fetchPersonal();
    } catch (err) {
      console.error('Error al borrar personal:', err);
      if (err.response?.status === 500) {
        alert(
          'Este profesor tiene uno o varios grupos asignados. ' +
          'Por favor, reasigna esos grupos antes de eliminar.'
        );
      } else {
        alert('Ocurrió un error al eliminar el registro.');
      }
    }
  };

  // Formatea fecha
  const formatDate = iso => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // Abre/cierra una fila
  const toggleRow = id => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  // Filtrar + paginar
  const filtered = personal.filter(p =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.institucion.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginated = filtered.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Cambio de pageSize
  const handleChangePageSize = e => {
    setPageSize(Number(e.target.value));
    setCurrentPage(0);
  };

  // Export Excel
  const handleExportExcel = () => {
    const rows = filtered.map(p => ({
      'Nombre completo': p.nombre_completo,
      Puesto: p.puesto,
      Institución: p.institucion,
      RFC: p.rfc,
      CURP: p.curp,
      Especialidad: p.especialidad,
      Teléfono: p.telefono,
      Email: p.email,
      'Fecha ingreso': formatDate(p.fecha_ingreso),
      Activo: p.activo ? 'Sí' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Personal');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'personal.xlsx');
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Personal', 14, 12);
    autoTable(doc, {
      head: [[
        'Nombre','Puesto','Institución','RFC','CURP','Especialidad',
        'Teléfono','Email','Fecha ingreso','Activo'
      ]],
      body: filtered.map(p => [
        p.nombre_completo, p.puesto, p.institucion,
        p.rfc, p.curp, p.especialidad,
        p.telefono, p.email, formatDate(p.fecha_ingreso),
        p.activo ? 'Sí' : 'No'
      ]),
      startY: 18,
      styles: { fontSize: 5 }
    });
    doc.save('personal.pdf');
  };

  return (
    <div className="table-wrapper" style={{ paddingTop: 36 }}>
      <h2>Personal</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        {isAdmin && <Link to="/personal/nuevo" className="link-button">+ Nuevo</Link>}
        <button className="button" onClick={handleExportExcel}>Exportar Excel</button>
        <button className="button" onClick={handleExportPDF}>Exportar PDF</button>
      </div>

      <input
        type="text"
        placeholder="Buscar personal por NOMBRE o PUESTO..."
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
        style={{
          width: '100%', padding: 8, margin: '12px 0',
          border: '1px solid #ccc', borderRadius: 4
        }}
      />

      <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="page-size" style={{ fontWeight: 500 }}>Registros por página:</label>
        <select
          id="page-size"
          value={pageSize}
          onChange={handleChangePageSize}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #aaa' }}
        >
          {[5,8,10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {isMobile ? (
        <div className="card-list">
          {paginated.map(p => (
            <div key={p.id_personal} className="card">
              <div className="card-header">
                <div><strong>Nombre:</strong> {p.nombre_completo}</div>
                <div><strong>Puesto:</strong> {p.puesto}</div>
                <div><strong>Institución:</strong> {p.institucion}</div>
              </div>
              <div className="card-actions">
                {isAdmin ? (
                  <>
                    <Link to={`/personal/${p.id_personal}`} className="button">Editar</Link>
                    <button className="button delete" onClick={() => handleDelete(p.id_personal)}>Borrar</button>
                  </>
                ) : <em>Sin permisos</em>}
                <button className="button" onClick={() => toggleRow(p.id_personal)}>
                  {expandedRow === p.id_personal ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              </div>
              {expandedRow === p.id_personal && (
                <div className="card-details">
                  <div><strong>RFC:</strong> {p.rfc}</div>
                  <div><strong>CURP:</strong> {p.curp}</div>
                  <div><strong>Especialidad:</strong> {p.especialidad}</div>
                  <div><strong>Teléfono:</strong> {p.telefono}</div>
                  <div><strong>Email:</strong> {p.email}</div>
                  <div><strong>Fecha Ingreso:</strong> {formatDate(p.fecha_ingreso)}</div>
                  <div><strong>Activo:</strong> {p.activo ? 'Sí' : 'No'}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puesto</th>
              <th>Institución</th>
              <th>Acciones</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <Fragment key={p.id_personal}>
                <tr>
                  <td>{p.nombre_completo}</td>
                  <td>{p.puesto}</td>
                  <td>{p.institucion}</td>
                  <td>
                    {isAdmin ? (
                      <>
                        <Link to={`/personal/${p.id_personal}`} className="button">Editar</Link>
                        <button className="button delete" onClick={() => handleDelete(p.id_personal)}>Borrar</button>
                      </>
                    ) : <em>Sin permisos</em>}
                  </td>
                  <td>
                    <button className="button" onClick={() => toggleRow(p.id_personal)}>
                      {expandedRow === p.id_personal ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
                {expandedRow === p.id_personal && (
                  <tr>
                    <td colSpan={5} style={{ background: '#f9f9f9', padding: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><strong>RFC:</strong> {p.rfc}</div>
                        <div><strong>CURP:</strong> {p.curp}</div>
                        <div><strong>Especialidad:</strong> {p.especialidad}</div>
                        <div><strong>Teléfono:</strong> {p.telefono}</div>
                        <div><strong>Email:</strong> {p.email}</div>
                        <div><strong>Fecha Ingreso:</strong> {formatDate(p.fecha_ingreso)}</div>
                        <div><strong>Activo:</strong> {p.activo ? 'Sí' : 'No'}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      <Pagination
        page={currentPage}
        totalPages={Math.max(1, Math.ceil(filtered.length / pageSize))}
        onPageChange={setCurrentPage}
      />
    </div>
);
}