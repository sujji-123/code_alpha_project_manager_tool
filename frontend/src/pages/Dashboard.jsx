// src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const getUserFromStorage = () => {
  try {
    const u = localStorage.getItem('user');
    if (u) return JSON.parse(u);
  } catch {
    // Ignore JSON parse errors
  }
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const dec = jwtDecode(token);
      return dec.user || { name: dec.name, email: dec.email, role: dec.role };
    }
  } catch {
    // Ignore jwtDecode errors
  }
  return null;
};

export default function DashboardRoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUserFromStorage();
    if (!user?.role) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role === 'project_manager') {
      navigate('/project-manager/dashboard', { replace: true });
    } else if (user.role === 'team_member') {
      navigate('/team-member/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return null;
}