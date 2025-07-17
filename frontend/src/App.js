import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import ListaAlumnos from './components/alumnos/ListaAlumnos';
import FormularioAlumno from './components/alumnos/FormularioAlumno';
import ListaPersonal from './components/personal/ListaPersonal';
import FormularioPersonal from './components/personal/FormularioPersonal';
import ListaGrupos        from './components/grupos/ListaGrupos';
import FormularioGrupo    from './components/grupos/FormularioGrupo';
import GruposPorProfesor from './components/grupos/GruposPorProfesor';

// INSTITUCIONES:
import ListaInstituciones from './components/instituciones/ListaInstituciones';
import FormularioInstitucion from './components/instituciones/FormularioInstitucion';

import './styles/responsive.css';

export default function App() {
  const { user } = useContext(AuthContext);
  const isAdmin = user.tipo === 'admin';
  const loggedIn = Boolean(user.token);

  return (
    <BrowserRouter>
      {/* Solo mostramos la barra si ya estás logueado */}
      {loggedIn && <Navbar />}

      <Routes>
        {/* Ruta pública: si ya está logueado, redirige a /alumnos y reemplaza el historial */}
<Route
  path="/login"
  element={
    loggedIn
      ? <Navigate to="/alumnos" replace />
      : <Login />
  }
/>
        {/* Alumnos */}
        <Route
          path="/alumnos"
          element={loggedIn ? <ListaAlumnos /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumnos/nuevo"
          element={loggedIn && isAdmin ? <FormularioAlumno /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumnos/:id"
          element={loggedIn && isAdmin ? <FormularioAlumno /> : <Navigate to="/login" />}
        />

        {/* Personal (solo admins) */}
        <Route
          path="/personal"
          element={loggedIn && isAdmin ? <ListaPersonal /> : <Navigate to="/alumnos" />}
        />
        <Route
          path="/personal/nuevo"
          element={loggedIn && isAdmin ? <FormularioPersonal /> : <Navigate to="/alumnos" />}
        />
        <Route
          path="/personal/:id"
          element={loggedIn && isAdmin ? <FormularioPersonal /> : <Navigate to="/alumnos" />}
        />

{/* Instituciones (solo admins) */}
{isAdmin && (
  <>
    <Route
      path="/instituciones"
      element={loggedIn ?  <ListaInstituciones /> : <Navigate to="/login" />}
    />
    <Route
      path="/instituciones/nueva"
      element={loggedIn ? <FormularioInstitucion /> : <Navigate to="/login" />}
    />
    <Route
      path="/instituciones/:id"
      element={loggedIn ? <FormularioInstitucion /> : <Navigate to="/login" />}
    />
  </>
)}

<Route
  path="/grupos"
  element={loggedIn && isAdmin ? <ListaGrupos /> : <Navigate to="/alumnos" />}
/>
<Route
  path="/grupos/nuevo"
  element={loggedIn && isAdmin ? <FormularioGrupo /> : <Navigate to="/alumnos" />}
/>
<Route
  path="/grupos/:id"
  element={loggedIn && isAdmin ? <FormularioGrupo /> : <Navigate to="/alumnos" />}
/>
<Route
    path="/grupos-por-profesor"
    element={<GruposPorProfesor />}
  />
<Route path="/" element={<Navigate to={loggedIn ? "/alumnos" : "/login"} />} />
<Route path="*" element={<Navigate to={loggedIn ? "/alumnos" : "/login"} />} />


      </Routes>
    </BrowserRouter>
  );
}
