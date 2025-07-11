// src/components/alumnos/FormularioAlumno.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function FormularioAlumno() {
  const { user } = useContext(AuthContext);
  const isAdmin = user.tipo === 'admin';
  const navigate = useNavigate();
  const { id } = useParams();

  const [catalogos, setCatalogos] = useState({
    instituciones: [],
    generos: [],
    grados: [],
    grupos: [],
    maestros: []
  });

  const [form, setForm] = useState({
    id_institucion:   '',
    id_genero:        '',
    id_grado:         '',
    id_grupo:         '',
    id_maestro:       '',
    nombre_completo:  '',
    curp:             '',
    fecha_nacimiento: '',
    padre_tutor:      '',
    contacto_emergencia: '',
    domicilio:        '',
    diagnostico_medico:  '',
    medicamentos:     '',
    alergias:         '',
    promovido:        '0',
    activo:           '1',
    observaciones:    ''
  });

  useEffect(() => {
    Promise.all([
      API.get('/instituciones/').then(res =>
        res.data.map(i => ({ value: i.id_institucion, label: i.nombre }))
      ),
      API.get('/generos').then(res => res.data),
      API.get('/grados').then(res => res.data),
      API.get('/grupos').then(res =>
       res.data.map(g => ({
         value: g.id_grupo,
         label: `${g.grado} — ${g.grupo}`
       }))
     ),
      API.get('/personal').then(res =>
        res.data.map(p => ({ value: p.id_personal, label: p.nombre_completo }))
      )
    ]).then(([inst, gen, grd, grupos, per]) => {
      setCatalogos({
        instituciones: inst,
        generos:       gen,
        grados:        grd,
        grupos:        grupos,
        maestros:      per
      });
    });

    if (id) {
      API.get(`/alumnos/${id}`).then(({ data }) => {
        setForm({
          id_institucion:   data.id_institucion  ?? '',
          id_genero:        data.id_genero       ?? '',
          id_grado:         data.id_grado        ?? '',
          id_grupo:         data.id_grupo        ?? '',
          id_maestro:       data.id_maestro      ?? '',
          nombre_completo:  data.nombre_completo || '',
          curp:             data.curp            || '',
          fecha_nacimiento: data.fecha_nacimiento
                                ? data.fecha_nacimiento.split('T')[0]
                                : '',
          padre_tutor:      data.padre_tutor     || '',
          contacto_emergencia: data.contacto_emergencia || '',
          domicilio:        data.domicilio       || '',
          diagnostico_medico:  data.diagnostico_medico || '',
          medicamentos:     data.medicamentos    || '',
          alergias:         data.alergias        || '',
          promovido:        data.promovido   ? '1' : '0',
          activo:           data.activo      ? '1' : '0',
          observaciones:    data.observaciones   || ''
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
      promovido: Number(form.promovido),
      no_promovido: 0,
      activo: Number(form.activo)
    };
    try {
      if (id) await API.put(`/alumnos/${id}`, payload);
      else    await API.post('/alumnos', payload);
      navigate('/alumnos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al guardar');
    }
  };

  if (!isAdmin && id) {
    return <p style={{ padding: 20 }}>No tienes permisos para editar</p>;
  }

  const fieldStyle = { marginBottom: 16 };
  const selectStyle= { width:'100%', padding:8, fontSize:16 };
  const inputStyle = { width:'100%', padding:8, fontSize:16 };

  return (
    <div style={{ maxWidth:600, margin:'2rem auto', padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2>{id ? 'Editar' : 'Nuevo'} Alumno</h2>
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
            {catalogos.instituciones.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>

        {/* Grupo */}
        <div style={fieldStyle}>
          <label>Grupo*</label>
          <select
            name="id_grupo"
            value={form.id_grupo}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">— Selecciona —</option>
            {catalogos.grupos.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Género */}
        <div style={fieldStyle}>
          <label>Género*</label>
          <select
            name="id_genero"
            value={form.id_genero}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">— Selecciona —</option>
            {catalogos.generos.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Nombre, CURP, Fecha de Nacimiento */}
        {[
          { label:'Nombre Completo*', name:'nombre_completo', type:'text' },
          { label:'CURP*',            name:'curp',            type:'text' },
          { label:'Fecha de Nacimiento*', name:'fecha_nacimiento', type:'date' }
        ].map(fld => (
          <div key={fld.name} style={fieldStyle}>
            <label>{fld.label}</label>
            <input
              name={fld.name}
              type={fld.type}
              value={form[fld.name]}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>
        ))}

        {/* Resto de campos */}
        {[
          { label:'Padre/Tutor',     name:'padre_tutor' },
          { label:'Contacto Emergencia', name:'contacto_emergencia' },
          { label:'Domicilio',       name:'domicilio' }
        ].map(fld => (
          <div key={fld.name} style={fieldStyle}>
            <label>{fld.label}</label>
            <input
              name={fld.name}
              type="text"
              value={form[fld.name]}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        ))}

        {/* Textareas */}
        {[
          { label:'Diagnóstico Médico', name:'diagnostico_medico' },
          { label:'Medicamentos',       name:'medicamentos' },
          { label:'Alergias',           name:'alergias' },
          { label:'Observaciones',      name:'observaciones' }
        ].map(fld => (
          <div key={fld.name} style={fieldStyle}>
            <label>{fld.label}</label>
            <textarea
              name={fld.name}
              value={form[fld.name]}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight:80 }}
            />
          </div>
        ))}

        {/* Promovido y Activo */}
        <div style={{ display:'flex', gap:16, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <label>Promovido</label>
            <select
              name="promovido"
              value={form.promovido}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="1">Sí</option>
              <option value="0">No</option>
            </select>
          </div>
          <div style={{ flex:1 }}>
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
