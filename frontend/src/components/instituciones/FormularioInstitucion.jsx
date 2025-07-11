import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams }          from 'react-router-dom';
import API                                from '../../services/api';
import { AuthContext }                    from '../../context/AuthContext';

export default function FormularioInstitucion() {
  const { user }   = useContext(AuthContext);
  const isAdmin    = user.tipo === 'admin';
  const navigate   = useNavigate();
  const { id }     = useParams();

  const [tipos, setTipos] = useState([]); // <-- Nuevo: catálogo de tipos
  const [form, setForm] = useState({
    id_tipo:         '',
    nombre:          '',
    cct:             '',
    zona:            '',
    sector:          '',
    domicilio:       '',
    telefono:        '',
    email:           '',
    director:        '',
    fecha_creacion:  '',
    activo:          '1'
  });

  // Cargar catálogo y, si edita, los datos
  useEffect(() => {
    API.get('/tipos-institucion').then(({ data }) => setTipos(data));
    if (id) {
      API.get(`/instituciones/${id}`).then(({ data }) => {
        setForm({
          id_tipo:         data.id_tipo        || '',
          nombre:          data.nombre         || '',
          cct:             data.cct            || '',
          zona:            data.zona           || '',
          sector:          data.sector         || '',
          domicilio:       data.domicilio      || '',
          telefono:        data.telefono       || '',
          email:           data.email          || '',
          director:        data.director       || '',
          fecha_creacion:  data.fecha_creacion ? data.fecha_creacion.split('T')[0] : '',
          activo:          data.activo ? '1' : '0'
        });
      });
    }
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isAdmin) return;
    const payload = {
      ...form,
      activo: Number(form.activo)
    };
    try {
      if (id) await API.put(`/instituciones/${id}`, payload);
      else    await API.post('/instituciones', payload);
      navigate('/instituciones');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error guardando');
    }
  };

  if (!isAdmin && id) {
    return <p style={{ padding:20 }}>No tienes permisos para editar</p>;
  }

  const fieldStyle  = { marginBottom:16, display:'flex', flexDirection:'column' };
  const inputStyle  = { padding:8, fontSize:16, width:'100%' };
  const selectStyle = { ...inputStyle };

  return (
    <div style={{ maxWidth:600, margin:'2rem auto', padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2>{ id ? 'Editar' : 'Nueva' } Institución</h2>
      <form onSubmit={handleSubmit}>

        {/* --- Select para el tipo de institución --- */}
        <div style={fieldStyle}>
          <label>Tipo de institución*</label>
          <select
            name="id_tipo"
            value={form.id_tipo}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">— Selecciona tipo —</option>
            {tipos.map(t => (
              <option key={t.id_tipo} value={t.id_tipo}>
                {t.tipo} - {t.descripcion}
              </option>
            ))}
          </select>
        </div>

        {[ // Campos principales
          { label:'Nombre*',      name:'nombre' },
          { label:'CCT',          name:'cct' },
          { label:'Zona',         name:'zona' },
          { label:'Sector',       name:'sector' },
          { label:'Domicilio',    name:'domicilio' },
          { label:'Teléfono',     name:'telefono' },
          { label:'Email',        name:'email', type:'email' },
          { label:'Director',     name:'director' },
          { label:'Fecha creación', name:'fecha_creacion', type:'date' }
        ].map(fld => (
          <div key={fld.name} style={fieldStyle}>
            <label>{fld.label}</label>
            {fld.name === 'domicilio' ? (
              <textarea
                name={fld.name}
                value={form[fld.name]}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: 40 }}
              />
            ) : (
              <input
                name={fld.name}
                type={fld.type || 'text'}
                value={form[fld.name]}
                onChange={handleChange}
                required={fld.label.endsWith('*')}
                style={inputStyle}
              />
            )}
          </div>
        ))}

        {/* Activo */}
        <div style={fieldStyle}>
          <label>Activo</label>
          <select
            name="activo"
            value={form.activo}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="1">Sí</option>
            <option value="0">No</option>
          </select>
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
