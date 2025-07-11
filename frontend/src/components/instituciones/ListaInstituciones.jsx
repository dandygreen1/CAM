// src/components/instituciones/ListaInstituciones.jsx
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

export default function ListaInstituciones() {
  const { user } = useContext(AuthContext);
  const isAdmin = user.tipo === 'admin';

  const [instituciones, setInstituciones] = useState([]);
  const [searchTerm, setSearchTerm]       = useState('');

  // Guardar un único registro expandido
  const [expandedRow, setExpandedRow] = useState(() => {
    const stored = localStorage.getItem('institucionesExpandedRow');
    return stored ? Number(stored) : null;
  });

  // Persistir página
  const [currentPage, setCurrentPage] = useState(() => {
    const stored = localStorage.getItem('institucionesPage');
    return stored ? Number(stored) : 0;
  });
  const [pageSize, setPageSize] = useState(5);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  // Responder a cambios de tamaño
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persistir el registro expandido
  useEffect(() => {
    if (expandedRow === null) {
      localStorage.removeItem('institucionesExpandedRow');
    } else {
      localStorage.setItem('institucionesExpandedRow', expandedRow);
    }
  }, [expandedRow]);

  // Persistir la página actual
  useEffect(() => {
    localStorage.setItem('institucionesPage', currentPage);
  }, [currentPage]);

  // Cargar datos sin resetear la página
  useEffect(() => {
    fetchInstituciones();
  }, []);
  const fetchInstituciones = async () => {
    const { data } = await API.get('/instituciones');
    setInstituciones(data);
  };

  // Eliminar
  const handleDelete = async id => {
    if (!window.confirm('¿Estás seguro de eliminar esta institución?')) return;
    try {
      await API.delete(`/instituciones/${id}`);
      fetchInstituciones();
    } catch (err) {
      if (
        err.response?.data?.alumnos?.length > 0
      ) {
        alert(
          'No se puede eliminar la institución porque tiene alumnos asignados:\n\n' +
          err.response.data.alumnos.join('\n')
        );
      } else {
        alert(err.response?.data?.mensaje || 'Error eliminando institución');
      }
    }
  };

  // Formato fecha
  const formatDate = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // Toggle un solo registro
  const toggleRow = id => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  // Filtrar y paginar
  const filtered = instituciones.filter(i =>
    (i.nombre      ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.cct         ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.director    ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginated = filtered.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Cambio de página
  const handleChangePageSize = e => {
    setPageSize(Number(e.target.value));
    setCurrentPage(0);
  };

  // Exportar Excel
  const handleExportExcel = () => {
    const dataToExport = filtered.map(i => ({
      'Nombre': i.nombre,
      'Tipo': i.tipo ?? '',
      'CCT': i.cct,
      'Zona': i.zona,
      'Sector': i.sector,
      'Director': i.director,
      'Teléfono': i.telefono,
      'Email': i.email,
      'Fecha creación': formatDate(i.fecha_creacion),
      'Activo': i.activo ? 'Sí' : 'No'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Instituciones');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'instituciones.xlsx');
  };

  // Exportar PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Instituciones', 14, 12);
    autoTable(doc, {
      head: [[
        'Nombre','Tipo','CCT','Zona','Sector',
        'Director','Teléfono','Email','Fecha creación','Activo'
      ]],
      body: filtered.map(i => [
        i.nombre,
        i.tipo     ?? '',
        i.cct,
        i.zona,
        i.sector,
        i.director,
        i.telefono,
        i.email,
        formatDate(i.fecha_creacion),
        i.activo ? 'Sí' : 'No'
      ]),
      startY: 18,
      styles: { fontSize: 5 }
    });
    doc.save('instituciones.pdf');
  };

  return (
    <div className="table-wrapper" style={{ paddingTop: 38 }}>
      <h2>Instituciones</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        {isAdmin && (
          <Link to="/instituciones/nueva" className="link-button">
            + Nueva Institución
          </Link>
        )}
        {isAdmin && <button className="button" onClick={handleExportExcel}>Exportar Excel</button>}
        <button className="button" onClick={handleExportPDF}>Exportar PDF</button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, CCT o director..."
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
          {paginated.map(i => (
            <div key={i.id_institucion} className="card">
              <div className="card-header">
                <div><strong>Nombre:</strong> {i.nombre}</div>
                <div><strong>Tipo:</strong> {i.tipo ?? ''}</div>
                <div><strong>CCT:</strong> {i.cct}</div>
                <div><strong>Director:</strong> {i.director}</div>
              </div>
              <div className="card-actions">
                {isAdmin ? (
                  <>
                    <Link to={`/instituciones/${i.id_institucion}`} className="button">Editar</Link>
                    <button className="button delete" onClick={() => handleDelete(i.id_institucion)}>
                      Borrar
                    </button>
                  </>
                ) : (
                  <em>Sin permisos</em>
                )}
                <button className="button" onClick={() => toggleRow(i.id_institucion)}>
                  {expandedRow === i.id_institucion ? 'Ocultar detalles' : 'Ver detalles'}
                </button>
              </div>
              {expandedRow === i.id_institucion && (
                <div className="card-details">
                  <div><strong>Zona:</strong> {i.zona}</div>
                  <div><strong>Sector:</strong> {i.sector}</div>
                  <div><strong>Domicilio:</strong> {i.domicilio}</div>
                  <div><strong>Teléfono:</strong> {i.telefono}</div>
                  <div><strong>Email:</strong> {i.email}</div>
                  <div><strong>Fecha creación:</strong> {formatDate(i.fecha_creacion)}</div>
                  <div><strong>Activo:</strong> {i.activo ? 'Sí' : 'No'}</div>
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
              <th>Tipo</th>
              <th>CCT</th>
              <th>Zona</th>
              <th>Sector</th>
              <th>Director</th>
              <th>Acciones</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(i => (
              <Fragment key={i.id_institucion}>
                <tr>
                  <td>{i.nombre}</td>
                  <td>{i.tipo ?? ''}</td>
                  <td>{i.cct}</td>
                  <td>{i.zona}</td>
                  <td>{i.sector}</td>
                  <td>{i.director}</td>
                  <td>
                    {isAdmin ? (
                      <>
                        <Link to={`/instituciones/${i.id_institucion}`} className="button">Editar</Link>{' '}
                        <button className="button delete" onClick={() => handleDelete(i.id_institucion)}>
                          Borrar
                        </button>
                      </>
                    ) : (
                      <em>Sin permisos</em>
                    )}
                  </td>
                  <td>
                    <button className="button" onClick={() => toggleRow(i.id_institucion)}>
                      {expandedRow === i.id_institucion ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
                {expandedRow === i.id_institucion && (
                  <tr>
                    <td colSpan={8} style={{ background: '#f9f9f9', padding: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><strong>Domicilio:</strong> {i.domicilio}</div>
                        <div><strong>Teléfono:</strong> {i.telefono}</div>
                        <div><strong>Email:</strong> {i.email}</div>
                        <div><strong>Fecha creación:</strong> {formatDate(i.fecha_creacion)}</div>
                        <div><strong>Activo:</strong> {i.activo ? 'Sí' : 'No'}</div>
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
