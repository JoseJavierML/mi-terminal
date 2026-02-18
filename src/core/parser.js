import { supabase } from '../services/supabase';

export const executeCommand = async (input, setHistory, isAuthenticated, setIsAuthenticated) => {
  const rawInput = input.trim();
  
  if (!isAuthenticated) {
    const email = import.meta.env.VITE_USER_EMAIL;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: rawInput,
    });

    if (error) {
      return 'ERROR: CREDENCIALES INVÁLIDAS. ACCESO DENEGADO.';
    }

    if (data.user) {
      setIsAuthenticated(true);
      return 'ACCESO CONCEDIDO. BIENVENIDO, SUPERVISOR JJ.';
    }
  }

  const args = rawInput.split(' ').filter(Boolean);
  if (args.length === 0) return '';
  const command = args[0].toLowerCase();

  switch (command) {
    case 'help':
      return 'COMANDOS DISPONIBLES:\n- help: Muestra esta ayuda\n- clear: Limpia la terminal\n- date: Muestra la fecha actual\n- whoami: Muestra el usuario actual\n- logout: Cierra la sesión';
    
    case 'clear':
      setHistory([]);
      return null;

    case 'date':
      return new Date().toLocaleString();

    case 'whoami':
      return 'admin [NIVEL DE ACCESO: SUPERVISOR OMEGA]';
      
    case 'logout':
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setHistory([]);
      return null;

    default:
      return `Comando no reconocido: ${command}. Escribe 'help' para ver la lista de comandos.`;
  }
};