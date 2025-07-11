// src/components/personal/FormularioPersonal.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams }             from 'react-router-dom';
import API                                  from '../../services/api';
import { AuthContext }                      from '../../context/AuthContext';

export default function FormularioPersonal() {
  const { user }   = useContext(AuthContext);
  const isAdmin    = user.tipo === 'admin';
  const navigate   = useNavigate();
  const { id }     = useParams();

  const [instituciones, setInstituciones] = useState([]);
  const [form, setForm] = useState({
    id_institucion:  '',
    nombre_completo: '',
    rfc:             '',
    curp:            '',
    puesto:          '',
    especialidad:    '',
    telefono:        '',
    email:           '',
    fecha_ingreso:   '',
    activo:          '1'
  });

  // Cargar instituciónes y, si edita, el registro
useEffect(() => {
  API.get('/instituciones').then(({ data }) => {
    // Transforma los datos para el <select>
    setInstituciones(data.map(i => ({
      value: i.id_institucion,
      label: i.nombre
    })));
  });
  if (id) {
    API.get(`/personal/${id}`).then(({ data }) => {
      setForm({
        id_institucion:  data.id_institucion   || '',
        nombre_completo: data.nombre_completo  || '',
        rfc:             data.rfc              || '',
        curp:            data.curp             || '',
        puesto:          data.puesto           || '',
        especialidad:    data.especialidad     || '',
        telefono:        data.telefono         || '',
        email:           data.email            || '',
        fecha_ingreso:   data.fecha_ingreso
                                ? data.fecha_ingreso.split('T')[0]
                                : '',
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
      if (id) await API.put(`/personal/${id}`, payload);
      else    await API.post('/personal', payload);
      navigate('/personal');
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
      <h2>{ id ? 'Editar' : 'Nuevo' } Personal</h2>
      <form onSubmit={handleSubmit}>
        {/* Institución */}
        <div style={fieldStyle}>
          <label>Institución*</label>
          <select
            name="id_institucion"
            value={form.id_institucion}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">— Selecciona —</option>
            {instituciones.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>

        {[
          { label:'Nombre Completo*', name:'nombre_completo' },
          { label:'RFC',             name:'rfc' },
          { label:'CURP',            name:'curp' },
          { label:'Puesto*',         name:'puesto' },
          { label:'Especialidad',    name:'especialidad' },
          { label:'Teléfono',        name:'telefono' },
          { label:'Email',           name:'email', type:'email' },
          { label:'Fecha Ingreso',   name:'fecha_ingreso', type:'date' }
        ].map(fld => (
          <div key={fld.name} style={fieldStyle}>
            <label>{fld.label}</label>
            <input
              name={fld.name}
              type={fld.type || 'text'}
              value={form[fld.name]}
              onChange={handleChange}
              required={fld.label.endsWith('*')}
              style={inputStyle}
            />
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
