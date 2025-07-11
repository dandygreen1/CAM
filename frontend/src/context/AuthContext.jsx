import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    token: localStorage.getItem('token'),
    tipo:  localStorage.getItem('tipo_usuario'),
    id:    localStorage.getItem('id_usuario')
  });

  // Cada vez que cambie user, sincronizamos con localStorage
  useEffect(() => {
    if (user.token) {
      localStorage.setItem('token', user.token);
      localStorage.setItem('tipo_usuario', user.tipo);
      localStorage.setItem('id_usuario', user.id);
    } else {
      localStorage.clear();
    }
  }, [user]);

  const login = ({ token, tipo_usuario, id_usuario }) => {
    setUser({
      token,
      tipo: tipo_usuario,
      id:   id_usuario
    });
  };

  const logout = () => {
    setUser({ token: null, tipo: null, id: null });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
