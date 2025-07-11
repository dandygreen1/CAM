import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams }          from 'react-router-dom';
import API                                 from '../../services/api';
import { AuthContext }                     from '../../context/AuthContext';

export default function FormularioGrupo() {
  const { user } = useContext(AuthContext);
  const isAdmin  = user.tipo === 'admin';
  const navigate = useNavigate();
  const { id }   = useParams();

  const [catalogos, setCatalogos] = useState({ grados: [], maestros: [] });
  const [form, setForm] = useState({
    nombre_grupo:  '',
    id_grado:      '',
    id_maestro:    '',
    ciclo_escolar: ``
  });

  useEffect(() => {
    // 1) Cargo grados y maestros
    Promise.all([
      API.get('/grados').then(res =>
        res.data.map(g => ({ value: g.value, label: g.label }))
      ),
      API.get('/personal').then(res =>
        res.data.map(p => ({ value: p.id_personal, label: p.nombre_completo }))
      )
    ]).then(([grados, maestros]) => {
      setCatalogos({ grados, maestros });
    });

    // 2) Si edito, traigo el grupo
    if (id) {
      API.get(`/grupos/${id}`).then(({ data }) => {
        setForm(prev => ({
          nombre_grupo:  data.nombre_grupo   ?? prev.nombre_grupo,
          id_grado:      data.id_grado       ?? prev.id_grado,
          id_maestro:    data.id_maestro     ?? prev.id_maestro,
          ciclo_escolar: data.ciclo_escolar  ?? prev.ciclo_escolar
        }));
      });
    }
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!form.nombre_grupo || !form.id_grado) {
      return alert('Grupo y Grado son obligatorios');
    }
    try {
      if (id) await API.put(`/grupos/${id}`, form);
      else    await API.post('/grupos', form);
      navigate('/grupos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error guardando grupo');
    }
  };

  if (!isAdmin && id) {
    return <p style={{ padding:20 }}>No tienes permisos para editar este grupo.</p>;
  }

  const fieldStyle  = { marginBottom:16, display:'flex', flexDirection:'column' };
  const inputStyle  = { padding:8, fontSize:16, width:'100%' };
  const selectStyle = { ...inputStyle };

  return (
    <div style={{
      maxWidth:600,
      margin:'2rem auto',
      padding:20,
      boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>{ id ? 'Editar' : 'Nuevo' } Grupo</h2>
      <form onSubmit={handleSubmit}>
        {/* Grupo */}
        <div style={fieldStyle}>
          <label>Grupo*</label>
          <select
            name="nombre_grupo"
            value={form.nombre_grupo}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">— Selecciona grupo —</option>
            {['A','B','C'].map(letter => (
              <option key={letter} value={letter}>{letter}</option>
            ))}
          </select>
        </div>

        {/* Grado */}
        <div style={fieldStyle}>
          <label>Grado*</label>
          <select
            name="id_grado"
            value={form.id_grado}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">— Selecciona grado —</option>
            {catalogos.grados.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Profesor */}
        <div style={fieldStyle}>
          <label>Profesor</label>
          <select
            name="id_maestro"
            value={form.id_maestro}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">— Sin asignar —</option>
            {catalogos.maestros.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Ciclo Escolar (editable) */}
        <div style={fieldStyle}>
          <label>Ciclo Escolar</label>
          <input
            name="ciclo_escolar"
            value={form.ciclo_escolar}
            onChange={handleChange}
            required
            placeholder="e.g. 2024-2025"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          style={{
            padding:'0.75rem 1.5rem',
            fontSize:16,
            background:'#4f46e5',
            color:'#fff',
            border:'none',
            borderRadius:4,
            cursor:'pointer'
          }}
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
