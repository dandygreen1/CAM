// src/components/common/Navbar.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';  // Importa los estilos

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user.tipo === 'admin';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1150);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1150);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const handleNavClick = () => {
    if (isMobile) setMenuOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isMobile && (
        <div
          className={`navbar-overlay ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <header className="navbar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <button
              className="navbar-hamburger"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
          <h1 style={{ color: '#fff', margin: 0, fontSize:22 }}>Centro educativo</h1>
        </div>

        {/* Links en desktop */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <Link to="/alumnos" className="navbar-link">Alumnos</Link>
            <Link to="/grupos-por-profesor" className="navbar-link">Grupos Asignados</Link>
            {isAdmin && (
              <>
                <Link to="/personal" className="navbar-link">Personal</Link>
                <Link to="/instituciones" className="navbar-link">Instituciones</Link>
                <Link to="/grupos" className="navbar-link">Grupos</Link>
              </>
            )}
          </nav>
        )}

        {/* Cerrar sesión */}
        {!isMobile && (
          <button onClick={handleLogout} className="navbar-logout">
            Cerrar sesión
          </button>
        )}
      </header>

      {/* Drawer en móvil */}
      {isMobile && (
        <nav className={`navbar-drawer ${menuOpen ? 'open' : ''}`}>
          <Link to="/alumnos" className="navbar-link" onClick={handleNavClick}>Alumnos</Link>
          <Link to="/grupos-por-profesor" className="navbar-link" onClick={handleNavClick}>Grupos Asignados</Link>
          {isAdmin && (
            <>
              <Link to="/personal" className="navbar-link" onClick={handleNavClick}>Personal</Link>
              <Link to="/instituciones" className="navbar-link" onClick={handleNavClick}>Instituciones</Link>
              <Link to="/grupos" className="navbar-link" onClick={handleNavClick}>Grupos</Link>
            </>
          )}
          <button onClick={handleLogout} className="navbar-logout">
            Cerrar sesión
          </button>
        </nav>
      )}
    </>
  );
}
