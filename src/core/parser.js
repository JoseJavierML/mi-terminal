export const executeCommand = (input, setHistory, isAuthenticated, setIsAuthenticated) => {
  const rawInput = input.trim();
  
  if (!isAuthenticated) {
    if (rawInput === 'tu_contraseña_secreta') {
      setIsAuthenticated(true);
      return 'ACCESO CONCEDIDO. BIENVENIDO, SUPERVISOR JJ.';
    } else {
      return 'ERROR: CREDENCIALES INVÁLIDAS. ACCESO DENEGADO.';
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
      setIsAuthenticated(false);
      setHistory([]);
      return null;

    default:
      return `Comando no reconocido: ${command}. Escribe 'help' para ver la lista de comandos.`;
  }
};