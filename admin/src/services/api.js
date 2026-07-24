import axios from 'axios';

// URL সঠিকভাবে ফর্ম্যাট করার নিরাপদ হেল্পার
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      url = 'http://localhost:5000';
    } else {
      url = 'https://api.sandreens.com';
    }
  }
  
  // single slash 'https:/api' থাকলে সেটাকে 'https://api' বানিয়ে দেবে
  url = url.replace(/https?:\/+(?!\/)/, 'https://');
  
  // শেষে কোনো extra / থাকলে তা কেটে দেবে
  url = url.replace(/\/+$/, '');

  // যদি শেষে /api না থাকে তবে যুক্ত করবে
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
