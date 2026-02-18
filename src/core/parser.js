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
      return 'COMANDOS DISPONIBLES:\n- help: Muestra esta ayuda\n- clear: Limpia la terminal\n- date: Muestra la fecha actual\n- whoami: Muestra el usuario actual\n- tasks [ls|add|done|rm]: Gestiona tus tareas\n- logout: Cierra la sesión';
    
    case 'clear':
      setHistory([]);
      return null;

    case 'date':
      return new Date().toLocaleString();

    case 'whoami':
      return 'admin [NIVEL DE ACCESO: SUPERVISOR OMEGA]';

    case 'tasks':
      if (args.length < 2) return 'USO: tasks [ls | add | done | rm] [argumentos]';
      const subCommand = args[1].toLowerCase();

      switch (subCommand) {
        case 'ls':
          const { data: tasks, error: fetchError } = await supabase.from('tasks').select('*').order('id', { ascending: true });
          if (fetchError) return `ERROR: ${fetchError.message}`;
          if (tasks.length === 0) return 'NO HAY TAREAS REGISTRADAS.';
          return tasks.map((t, index) => `${t.is_done ? '[X]' : '[]'} ${index + 1}: ${t.description}`).join('\n');

        case 'add':
          const description = args.slice(2).join(' ');
          if (!description) return 'ERROR: DEBE ESPECIFICAR UNA DESCRIPCIÓN.';
          const { error: insertError } = await supabase.from('tasks').insert([{ description }]);
          if (insertError) return `ERROR: ${insertError.message}`;
          return 'TAREA AÑADIDA CORRECTAMENTE.';

        case 'done':
          const doneIndex = parseInt(args[2]);
          if (isNaN(doneIndex)) return 'ERROR: NÚMERO DE TAREA INVÁLIDO.';
          const { data: doneTasks, error: doneFetchError } = await supabase.from('tasks').select('id').order('id', { ascending: true });
          if (doneFetchError) return `ERROR: ${doneFetchError.message}`;
          if (doneIndex < 1 || doneIndex > doneTasks.length) return 'ERROR: LA TAREA ESPECIFICADA NO EXISTE.';
          const realDoneId = doneTasks[doneIndex - 1].id;
          const { error: updateError } = await supabase.from('tasks').update({ is_done: true }).eq('id', realDoneId);
          if (updateError) return `ERROR: ${updateError.message}`;
          return `TAREA ${doneIndex} MARCADA COMO COMPLETADA.`;

        case 'rm':
          const rmIndex = parseInt(args[2]);
          if (isNaN(rmIndex)) return 'ERROR: NÚMERO DE TAREA INVÁLIDO.';
          const { data: rmTasks, error: rmFetchError } = await supabase.from('tasks').select('id').order('id', { ascending: true });
          if (rmFetchError) return `ERROR: ${rmFetchError.message}`;
          if (rmIndex < 1 || rmIndex > rmTasks.length) return 'ERROR: LA TAREA ESPECIFICADA NO EXISTE.';
          const realRmId = rmTasks[rmIndex - 1].id;
          const { error: deleteError } = await supabase.from('tasks').delete().eq('id', realRmId);
          if (deleteError) return `ERROR: ${deleteError.message}`;
          return `TAREA ${rmIndex} ELIMINADA DEL SISTEMA.`;

        default:
          return `SUBCÓMANDO NO RECONOCIDO: ${subCommand}`;
      }
      
    case 'logout':
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setHistory([]);
      return null;

    default:
      return `Comando no reconocido: ${command}. Escribe 'help' para ver la lista de comandos.`;
  }
};