import { useState, useRef, useEffect } from 'react';
import { executeCommand } from './core/parser';
import { supabase } from './services/supabase';
import './index.css';

const PongGame = ({ onClose }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let ball = { x: 400, y: 300, vx: 6, vy: 6, radius: 8 };
    let player = { x: 20, y: 250, width: 10, height: 100, dy: 0, score: 0 };
    let computer = { x: 770, y: 250, width: 10, height: 100, speed: 5.5, score: 0 };

    const draw = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#2a9d13';
      for (let i = 0; i <= canvas.height; i += 40) {
        ctx.fillRect(canvas.width / 2 - 1, i, 2, 20);
      }

      ctx.font = '40px monospace';
      ctx.fillText(player.score, canvas.width / 4, 50);
      ctx.fillText(computer.score, 3 * canvas.width / 4, 50);

      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.vx = (Math.random() > 0.5 ? 6 : -6);
      ball.vy = (Math.random() > 0.5 ? 6 : -6);
    };

    const update = () => {
      player.y += player.dy;
      if (player.y < 0) player.y = 0;
      if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

      if (computer.y + computer.height / 2 < ball.y) {
        computer.y += computer.speed;
      } else {
        computer.y -= computer.speed;
      }
      if (computer.y < 0) computer.y = 0;
      if (computer.y + computer.height > canvas.height) computer.y = canvas.height - computer.height;

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.vy = -ball.vy;
      }

      let paddle = ball.x < canvas.width / 2 ? player : computer;
      if (
        ball.x + ball.radius > paddle.x &&
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height
      ) {
        ball.vx = -ball.vx;
        if (ball.x < canvas.width / 2) {
            ball.x = paddle.x + paddle.width + ball.radius;
        } else {
            ball.x = paddle.x - ball.radius;
        }
        let hitPoint = ball.y - (paddle.y + paddle.height / 2);
        ball.vy = hitPoint * 0.2;
        ball.vx += (ball.vx > 0 ? 0.5 : -0.5);
      }

      if (ball.x - ball.radius < 0) {
        computer.score++;
        resetBall();
      } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
      }
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') player.dy = -8;
      if (e.key === 'ArrowDown') player.dy = 8;
      if (e.key === 'Escape') onClose();
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') player.dy = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onClose]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' }}>
      <div style={{ color: '#2a9d13', marginBottom: '20px', fontWeight: 'bold', fontFamily: 'monospace' }}>
        PONG PROTOCOL | CONTROLES: Flecha Arriba / Abajo | SALIR: [ ESC ]
      </div>
      <canvas ref={canvasRef} width={800} height={600} style={{ border: '2px solid #2a9d13', backgroundColor: 'black' }} />
    </div>
  );
};

function App() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [inputHistory, setInputHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [editorState, setEditorState] = useState({ isOpen: false, id: null, title: '', content: '' });
  const [pongState, setPongState] = useState({ isOpen: false });
  const [pomodoro, setPomodoro] = useState({
    isActive: false,
    timeLeft: 25 * 60,
    mode: 'work',
    cycle: 1
  });
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleScreenClick = () => {
    if (inputRef.current && !editorState.isOpen && !pongState.isOpen) inputRef.current.focus();
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < inputHistory.length) {
          setHistoryIndex(nextIndex);
          setInputValue(inputHistory[inputHistory.length - 1 - nextIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        setHistoryIndex(prevIndex);
        setInputValue(inputHistory[inputHistory.length - 1 - prevIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue('');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() === '') return;

      const currentInput = inputValue;
      const wasAuthenticated = isAuthenticated;

      if (wasAuthenticated) {
        setInputHistory(prev => [...prev, currentInput]);
      }
      setHistoryIndex(-1);
      
      const output = await executeCommand(currentInput, setHistory, isAuthenticated, setIsAuthenticated, pomodoro, setPomodoro, userRole, setUserRole, setEditorState, setPongState);

      if (!wasAuthenticated && (output === 'ACCESO CONCEDIDO. BIENVENIDO, SUPERVISOR JJ.' || output === 'ACCESO DE INVITADO CONCEDIDO. FUNCIONES LIMITADAS.')) {
        setHistory([]);
      } else if (output !== null) {
        const newCommand = {
          id: Date.now(),
          command: isAuthenticated ? currentInput : currentInput.replace(/./g, '*'),
          output: output
        };
        setHistory(prev => [...prev, newCommand]);
      }
      
      setInputValue('');
    }
  };

  const handleEditorKeyDown = async (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (editorState.id) {
        await supabase.from('notes').update({ content: editorState.content, updated_at: new Date() }).eq('id', editorState.id);
      } else {
        const { data } = await supabase.from('notes').insert([{ title: editorState.title, content: editorState.content }]).select().single();
        if (data) {
          setEditorState(prev => ({ ...prev, id: data.id }));
        }
      }
      setHistory(prev => [...prev, { id: Date.now(), command: 'SYSTEM', output: `ARCHIVO '${editorState.title}' GUARDADO.` }]);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'x') {
      e.preventDefault();
      setEditorState({ isOpen: false, id: null, title: '', content: '' });
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  };

  useEffect(() => {
    let interval = null;
    if (pomodoro.isActive && pomodoro.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoro(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (pomodoro.isActive && pomodoro.timeLeft === 0) {
      let nextMode = 'work';
      let nextCycle = pomodoro.cycle;
      let nextTime = 25 * 60;
      let alertMsg = '';

      if (pomodoro.mode === 'work') {
        if (pomodoro.cycle < 4) {
          nextMode = 'shortBreak';
          nextTime = 5 * 60;
          alertMsg = '¡TRABAJO COMPLETADO! INICIANDO DESCANSO CORTO (5 MIN).';
        } else {
          nextMode = 'longBreak';
          nextTime = 15 * 60;
          alertMsg = '¡CICLO COMPLETADO! INICIANDO DESCANSO LARGO (15 MIN).';
        }
      } else if (pomodoro.mode === 'shortBreak') {
        nextMode = 'work';
        nextCycle = pomodoro.cycle + 1;
        nextTime = 25 * 60;
        alertMsg = '¡DESCANSO TERMINADO! VOLVIENDO AL TRABAJO.';
      } else if (pomodoro.mode === 'longBreak') {
        nextMode = 'work';
        nextCycle = 1;
        nextTime = 25 * 60;
        alertMsg = '¡POMODORO COMPLETADO! REINICIANDO CICLO DE TRABAJO.';
      }

      setHistory(prev => [...prev, {
        id: Date.now(),
        command: 'SYSTEM ALARM',
        output: alertMsg
      }]);

      setPomodoro({ isActive: true, timeLeft: nextTime, mode: nextMode, cycle: nextCycle });
    }
    return () => clearInterval(interval);
  }, [pomodoro.isActive, pomodoro.timeLeft]);

  useEffect(() => {
    if (containerRef.current && !editorState.isOpen && !pongState.isOpen) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history, editorState.isOpen, pongState.isOpen]);

  const promptPrefix = userRole === 'guest' ? 'guest@vault-tec:~$ ' : 'JJ@vault-tec:~$ ';

  if (pongState.isOpen) {
    return <PongGame onClose={() => {
      setPongState({ isOpen: false });
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }} />;
  }

  if (editorState.isOpen) {
    return (
      <div 
        className="crt-text" 
        style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: 'black' }}
      >
        <div style={{ backgroundColor: '#2a9d13', color: 'black', padding: '2px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>GNU nano</span>
          <span>{editorState.title}</span>
          <span></span>
        </div>
        
        <textarea 
          value={editorState.content}
          onChange={(e) => setEditorState({ ...editorState, content: e.target.value })}
          onKeyDown={handleEditorKeyDown}
          autoFocus
          style={{ flex: 1, backgroundColor: 'transparent', color: '#2a9d13', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: 'inherit', marginTop: '10px' }}
          spellCheck="false"
        />

        <div style={{ marginTop: '10px', display: 'flex', gap: '30px', borderTop: '1px solid #2a9d13', paddingTop: '10px' }}>
          <span><span style={{ backgroundColor: '#2a9d13', color: 'black', padding: '0 4px' }}>^S</span> Guardar</span>
          <span><span style={{ backgroundColor: '#2a9d13', color: 'black', padding: '0 4px' }}>^X</span> Salir</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="crt-text" 
      onClick={handleScreenClick} 
      ref={containerRef}
      style={{ height: '100vh', cursor: 'text', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10vh', marginBottom: '5vh' }}>
        <pre style={{ fontWeight: 'bold', fontSize: '1.5rem', lineHeight: '1.2' }}>
{`
     ██████╗         ██████╗ 
     ╚══██ ║         ╚══██ ║  
        ██ ║            ██ ║  
   ██   ██ ║       ██   ██ ║  
   ╚██████╔╝  ███  ╚██████╔╝ 
    ╚═════╝   ███   ╚═════╝  
`}
        </pre>
      </div>

      {!isAuthenticated && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p>SISTEMA DE SEGURIDAD VAULT-TEC</p>
          <p>POR FAVOR, INTRODUZCA LA CLAVE DE ACCESO</p>
        </div>
      )}
      
      {history.map((item) => (
        <div key={item.id} style={{ marginBottom: '10px' }}>
          <div><span>{isAuthenticated && item.command !== 'SYSTEM ALARM' && item.command !== 'SYSTEM' ? promptPrefix : ''}</span><span style={item.command === 'SYSTEM ALARM' || item.command === 'SYSTEM' ? { color: '#ffea00', fontWeight: 'bold' } : {}}>{item.command}</span></div>
          <div style={{ color: item.command === 'SYSTEM ALARM' || item.command === 'SYSTEM' ? '#ffea00' : '#2a9d13', whiteSpace: 'pre-line' }}>{item.output}</div>
        </div>
      ))}
      
      <div>
        <span>{isAuthenticated ? promptPrefix : 'PASSWORD: '}</span>
        <span>{isAuthenticated ? inputValue : inputValue.replace(/./g, '*')}</span>
        <span className="cursor"></span>
      </div>

      <input
        type="text"
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="hidden-input"
        autoFocus
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
}

export default App;