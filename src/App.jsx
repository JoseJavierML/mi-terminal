import { useState, useRef, useEffect } from 'react';
import { executeCommand } from './core/parser';
import './index.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleScreenClick = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() === '') return;

      const wasAuthenticated = isAuthenticated;
      const output = executeCommand(inputValue, setHistory, isAuthenticated, setIsAuthenticated);

      if (!wasAuthenticated && (inputValue.trim() === 'tu_contraseña_secreta')) {
        setHistory([]);
      } else if (output !== null) {
        const newCommand = {
          id: Date.now(),
          command: isAuthenticated ? inputValue : inputValue.replace(/./g, '*'),
          output: output
        };
        setHistory(prev => [...prev, newCommand]);
      }
      
      setInputValue('');
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

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
          <div><span>{isAuthenticated ? 'JJ@vault-tec:~$ ' : 'PASSWORD: '}</span><span>{item.command}</span></div>
          <div style={{ color: '#2a9d13', whiteSpace: 'pre-line' }}>{item.output}</div>
        </div>
      ))}
      
      <div>
        <span>{isAuthenticated ? 'JJ@vault-tec:~$ ' : 'PASSWORD: '}</span>
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