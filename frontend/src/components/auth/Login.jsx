import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

export default function Login() {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = e =>
    setCreds({ ...creds, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', creds);
      // data contiene: { token, tipo_usuario, id_usuario }
      login(data);
      navigate('/alumnos');
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error de autenticación');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuario</label>
          <input
            name="username"
            value={creds.username}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, margin: '0.5rem 0' }}
          />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            name="password"
            type="password"
            value={creds.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, margin: '0.5rem 0' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
