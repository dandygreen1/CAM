
/* src/components/auth/Login.jsx */
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../styles/Login.css';

export default function Login() {
  // Única declaración de login y navigate
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirigir si ya autenticado
  useEffect(() => {
    if (user?.token) {
      navigate('/alumnos', { replace: true });
    }
  }, [user, navigate]);

  const [creds, setCreds] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e =>
    setCreds({ ...creds, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', creds);
      login(data);
      navigate('/alumnos', { replace: true });
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error de autenticación');
    }
  };

  return (
    <div className="login-container">
      <div className="form-wrapper">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <FaUser className="input-icon" />
            <input
              name="username"
              type="text"
              placeholder="Usuario"
              value={creds.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-wrapper">
            <FaLock className="input-icon" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={creds.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(prev => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button className="btn-login" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

/* Nota: asegúrate de tener react-icons instalado: npm install react-icons */
