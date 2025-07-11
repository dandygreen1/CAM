// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes    from './routes/auth.js';
import alumnosRoutes from './routes/alumnos.js';
import personalRoutes from './routes/personal.js';
import institucionesRoutes from './routes/instituciones.js';
import generosRoutes       from './routes/generos.js';
import gradosRoutes        from './routes/grados.js';
import tiposInstitucionRoutes from './routes/tiposInstitucion.js';
import gruposRoutes from './routes/grupos.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Esta ruta debe quedarse abierta:
app.use('/api/auth', authRoutes);

app.use('/api/grupos', gruposRoutes);

app.use('/api/instituciones', institucionesRoutes);
app.use('/api/tipos-institucion', tiposInstitucionRoutes);


app.use('/api/generos',       generosRoutes);
app.use('/api/grados',        gradosRoutes);

app.use('/api/alumnos',  alumnosRoutes);
app.use('/api/personal', personalRoutes);



app.listen(process.env.PORT, () =>
  console.log(`DIME QUIEN TE QUIERE COMO EL NENE 🗣🗣🗣🗣 Backend corriendo en http://localhost:${process.env.PORT}`)
);
