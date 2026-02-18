import { useState, useRef } from 'react';
import './index.css';

function App() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  const handleScreenClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (inputValue.trim() === '') return;
      const newCommand = {
        id: Date.now(), 
        command: inputValue,
        output: `Comando no reconocido: ${inputValue}` 
      };

      setHistory([...history, newCommand]);
      setInputValue('');
    }
  };

  return (
    <div className="crt-text" onClick={handleScreenClick} style={{ height: '100vh', cursor: 'text', overflowY: 'auto', paddingBottom: '20px' }}>
      <p>ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM</p>
      <p>COPYRIGHT 2075-2077 ROBCO INDUSTRIES</p>
      <p>-Server 1-</p>
      <br />
      <p>Iniciando sistema de base de datos...</p>
      <p>Cargando modulos personales...</p>
      <br />

      {}
      {history.map((item) => (
        <div key={item.id} style={{ marginBottom: '10px' }}>
          <div><span>admin@vault-tec:~$ </span><span>{item.command}</span></div>
          {}
          <div style={{ color: '#2a9d13' }}>{item.output}</div>
        </div>
      ))}
      
      {}
      <div>
        <span>admin@vault-tec:~$ </span>
        <span>{inputValue}</span>
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