import axios from 'axios';

const host = window.location.hostname;  


const API = axios.create({
  baseURL: `${window.location.protocol}//${host}:5000/api`
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
