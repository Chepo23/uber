// Autenticación local simple (sin depender de Sierra)
// Demo users para desarrollo

const DEMO_USERS = {
  'admin': { password: 'admin123', username: 'admin', id: '1001', role: 'admin' },
  'usuario': { password: 'usuario123', username: 'usuario', id: '1002', role: 'user' },
  'brandon': { password: 'brandon123', username: 'brandon', id: '1003', role: 'user' },
};

export const localLogin = async ({ username, password }) => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = DEMO_USERS[username?.toLowerCase()];
  
  if (!user || user.password !== password) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  // Retornar sesión válida
  return {
    accessToken: `local_token_${user.id}_${Date.now()}`,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

export const getLocalDemoUsers = () => {
  return Object.entries(DEMO_USERS).map(([username, data]) => ({
    username,
    password: data.password
  }));
};
