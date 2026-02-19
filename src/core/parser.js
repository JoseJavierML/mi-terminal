import { supabase } from '../services/supabase';

const getWeatherInfo = async () => {
  try {
    const latitude = 38.9943;
    const longitude = -1.8585;
    const city = 'ALBACETE';

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();
    const { temperature, weathercode } = weatherData.current_weather;

    let icon = '☁️';
    if (weathercode === 0) icon = '☀️';
    else if (weathercode > 0 && weathercode < 4) icon = '⛅';
    else if (weathercode === 45 || weathercode === 48) icon = '🌫️';
    else if (weathercode >= 51 && weathercode <= 67) icon = '🌧️';
    else if (weathercode >= 71 && weathercode <= 77) icon = '❄️';
    else if (weathercode >= 80 && weathercode <= 82) icon = '🌧️';
    else if (weathercode >= 95) icon = '⛈️';

    return `\nUBICACIÓN: ${city}\nCLIMA: ${icon} ${temperature}°C`;
  } catch (e) {
    return '\n[ERROR DE CONEXIÓN CON EL SATÉLITE METEOROLÓGICO]';
  }
};

export const executeCommand = async (input, setHistory, isAuthenticated, setIsAuthenticated, pomodoro, setPomodoro, userRole, setUserRole, setEditorState, setPongState) => {
  const rawInput = input.trim();
  
  if (!isAuthenticated) {
    if (rawInput.toLowerCase() === 'invitado') {
      setIsAuthenticated(true);
      setUserRole('guest');
      return 'ACCESO DE INVITADO CONCEDIDO. FUNCIONES LIMITADAS.';
    }

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
      setUserRole('admin');
      return 'ACCESO CONCEDIDO. BIENVENIDO, SUPERVISOR JJ.';
    }
  }

  const args = rawInput.split(' ').filter(Boolean);
  if (args.length === 0) return '';
  const command = args[0].toLowerCase();

  switch (command) {
    case 'help':
      if (userRole === 'guest') {
        return 'COMANDOS DISPONIBLES:\n- help: Muestra esta ayuda\n- clear: Limpia la terminal\n- whoami: Muestra el usuario actual\n- pong: Minijuego retro\n- pomodoro [start|status|stop]: Temporizador\n- logout: Cierra la sesión';
      }
      return 'COMANDOS DISPONIBLES:\n- help: Muestra esta ayuda\n- clear: Limpia la terminal\n- date: Muestra la fecha y el clima local\n- whoami: Muestra el usuario actual\n- tasks [ls|add|done|rm]: Gestiona tus tareas\n- habits [ls|add|done|rm]: Gestiona tus hábitos diarios\n- notes [ls|rm]: Lista o elimina tus notas\n- nano [archivo]: Abre el editor de texto\n- pong: Minijuego retro\n- pomodoro [start|status|stop]: Temporizador\n- logout: Cierra la sesión';
    
    case 'clear':
      setHistory([]);
      return null;

    case 'date':
      if (userRole === 'guest') return 'ACCESO DENEGADO. REQUIERE NIVEL DE ACCESO: SUPERVISOR.';
      const currentDate = new Date().toLocaleString();
      const weatherStr = await getWeatherInfo();
      return currentDate + weatherStr;

    case 'whoami':
      return userRole === 'admin' ? 'admin [NIVEL DE ACCESO: SUPERVISOR OMEGA]' : 'guest [NIVEL DE ACCESO: INVITADO LIMITADO]';

    case 'pong':
      setPongState({ isOpen: true });
      return null;

    case 'nano':
      if (userRole === 'guest') return 'ACCESO DENEGADO. REQUIERE NIVEL DE ACCESO: SUPERVISOR.';
      if (args.length < 2) return 'USO: nano [nombre_del_archivo]';
      const title = args.slice(1).join(' ');
      
      const { data: noteData, error: noteError } = await supabase.from('notes').select('*').eq('title', title).maybeSingle();
      
      if (noteError) return `ERROR: ${noteError.message}`;
      
      setEditorState({
        isOpen: true,
        id: noteData ? noteData.id : null,
        title: title,
        content: noteData ? noteData.content : ''
      });
      return null;

    case 'notes':
      if (userRole === 'guest') return 'ACCESO DENEGADO. REQUIERE NIVEL DE ACCESO: SUPERVISOR.';
      if (args.length < 2) return 'USO: notes [ls | rm]';
      const nSubCommand = args[1].toLowerCase();

      switch (nSubCommand) {
        case 'ls':
          const { data: notesList, error: nFetchError } = await supabase.from('notes').select('id, title, updated_at').order('updated_at', { ascending: false });
          if (nFetchError) return `ERROR: ${nFetchError.message}`;
          if (notesList.length === 0) return 'NO HAY NOTAS REGISTRADAS.';
          return notesList.map((n, index) => `${index + 1}: ${n.title} (Modificado: ${new Date(n.updated_at).toLocaleDateString()})`).join('\n');

        case 'rm':
          const nRmIndex = parseInt(args[2]);
          if (isNaN(nRmIndex)) return 'ERROR: NÚMERO DE NOTA INVÁLIDO.';
          const { data: rmNotes, error: nRmFetchError } = await supabase.from('notes').select('id').order('updated_at', { ascending: false });
          if (nRmFetchError) return `ERROR: ${nRmFetchError.message}`;
          if (nRmIndex < 1 || nRmIndex > rmNotes.length) return 'ERROR: LA NOTA ESPECIFICADA NO EXISTE.';
          const realNRmId = rmNotes[nRmIndex - 1].id;
          const { error: nDeleteError } = await supabase.from('notes').delete().eq('id', realNRmId);
          if (nDeleteError) return `ERROR: ${nDeleteError.message}`;
          return `NOTA ${nRmIndex} ELIMINADA DEL SISTEMA.`;

        default:
          return `SUBCÓMANDO NO RECONOCIDO: ${nSubCommand}`;
      }

    case 'pomodoro':
      if (args.length < 2) return 'USO: pomodoro [start | status | stop]';
      const pCommand = args[1].toLowerCase();
      
      switch (pCommand) {
        case 'start':
          if (pomodoro.isActive) return 'EL POMODORO YA ESTÁ EN MARCHA.';
          setPomodoro(prev => ({ ...prev, isActive: true }));
          return 'POMODORO INICIADO. ¡A TRABAJAR!';
          
        case 'stop':
          setPomodoro({ isActive: false, timeLeft: 25 * 60, mode: 'work', cycle: 1 });
          return 'POMODORO DETENIDO Y REINICIADO.';
          
        case 'status':
          const mins = String(Math.floor(pomodoro.timeLeft / 60)).padStart(2, '0');
          const secs = String(pomodoro.timeLeft % 60).padStart(2, '0');
          const modeStr = pomodoro.mode === 'work' ? 'TRABAJO' : pomodoro.mode === 'shortBreak' ? 'DESCANSO CORTO' : 'DESCANSO LARGO';
          
          return `ESTADO: ${modeStr} (CICLO ${pomodoro.cycle}/4)\n  .──────────────────.\n |    [ ${mins}:${secs} ]    |\n  '──────────────────'`;
          
        default:
          return `SUBCÓMANDO NO RECONOCIDO: ${pCommand}`;
      }

    case 'tasks':
      if (userRole === 'guest') return 'ACCESO DENEGADO. REQUIERE NIVEL DE ACCESO: SUPERVISOR.';
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

    case 'habits':
      if (userRole === 'guest') return 'ACCESO DENEGADO. REQUIERE NIVEL DE ACCESO: SUPERVISOR.';
      if (args.length < 2) return 'USO: habits [ls | add | done | rm] [argumentos]';
      const hSubCommand = args[1].toLowerCase();
      const today = new Date().toISOString().split('T')[0];

      switch (hSubCommand) {
        case 'ls':
          const { data: habits, error: hFetchError } = await supabase.from('habits').select('*').order('id', { ascending: true });
          if (hFetchError) return `ERROR: ${hFetchError.message}`;
          if (habits.length === 0) return 'NO HAY HÁBITOS REGISTRADOS.';
          
          return habits.map((h, index) => {
            const isDoneToday = h.last_completed_date === today;
            const createdDate = new Date(h.created_at);
            const currentDate = new Date(today);
            const totalDays = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24)) + 1;
            return `${isDoneToday ? '[X]' : '[]'} ${index + 1}: ${h.description} (${h.completion_count}/${totalDays})`;
          }).join('\n');

        case 'add':
          const hDescription = args.slice(2).join(' ');
          if (!hDescription) return 'ERROR: DEBE ESPECIFICAR UNA DESCRIPCIÓN.';
          const { error: hInsertError } = await supabase.from('habits').insert([{ description: hDescription }]);
          if (hInsertError) return `ERROR: ${hInsertError.message}`;
          return 'HÁBITO AÑADIDO CORRECTAMENTE.';

        case 'done':
          const hDoneIndex = parseInt(args[2]);
          if (isNaN(hDoneIndex)) return 'ERROR: NÚMERO DE HÁBITO INVÁLIDO.';
          const { data: hDoneData, error: hDoneFetchError } = await supabase.from('habits').select('*').order('id', { ascending: true });
          if (hDoneFetchError) return `ERROR: ${hDoneFetchError.message}`;
          if (hDoneIndex < 1 || hDoneIndex > hDoneData.length) return 'ERROR: EL HÁBITO ESPECIFICADO NO EXISTE.';
          
          const habitToComplete = hDoneData[hDoneIndex - 1];
          if (habitToComplete.last_completed_date === today) return 'ERROR: YA HAS COMPLETADO ESTE HÁBITO HOY.';

          const newCount = habitToComplete.completion_count + 1;
          const { error: hUpdateError } = await supabase.from('habits').update({ last_completed_date: today, completion_count: newCount }).eq('id', habitToComplete.id);
          if (hUpdateError) return `ERROR: ${hUpdateError.message}`;
          return `HÁBITO ${hDoneIndex} MARCADO COMO COMPLETADO POR HOY.`;

        case 'rm':
          const hRmIndex = parseInt(args[2]);
          if (isNaN(hRmIndex)) return 'ERROR: NÚMERO DE HÁBITO INVÁLIDO.';
          const { data: hRmTasks, error: hRmFetchError } = await supabase.from('habits').select('id').order('id', { ascending: true });
          if (hRmFetchError) return `ERROR: ${hRmFetchError.message}`;
          if (hRmIndex < 1 || hRmIndex > hRmTasks.length) return 'ERROR: EL HÁBITO ESPECIFICADO NO EXISTE.';
          const realHRmId = hRmTasks[hRmIndex - 1].id;
          const { error: hDeleteError } = await supabase.from('habits').delete().eq('id', realHRmId);
          if (hDeleteError) return `ERROR: ${hDeleteError.message}`;
          return `HÁBITO ${hRmIndex} ELIMINADO DEL SISTEMA.`;

        default:
          return `SUBCÓMANDO NO RECONOCIDO: ${hSubCommand}`;
      }
      
    case 'logout':
      if (userRole === 'admin') {
        await supabase.auth.signOut();
      }
      setIsAuthenticated(false);
      setUserRole(null);
      setHistory([]);
      return null;

    default:
      return `Comando no reconocido: ${command}. Escribe 'help' para ver la lista de comandos.`;
  }
};