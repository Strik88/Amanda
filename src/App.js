import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const presetOefeningen = {
  "Burnout breathing (4-7-8)": { inademen: 4, vasthouden: 7, uitademen: 8, pauze: 0.5 },
  "Vierkant ademen": { inademen: 4, vasthouden: 4, uitademen: 4, pauze: 4 },
  "Ontspannende ademhaling": { inademen: 4, vasthouden: 2, uitademen: 6, pauze: 0.5 },
  // Voeg hier meer oefeningen toe
};

function App() {
  const [fase, setFase] = useState('inademen');
  const [aftellen, setAftellen] = useState(4);
  const [isActief, setIsActief] = useState(false);
  const [inademTijd, setInademTijd] = useState('4');
  const [vasthoudTijd, setVasthoudTijd] = useState('7');
  const [uitademTijd, setUitademTijd] = useState('8');
  const [voortgang, setVoortgang] = useState(0);
  const [cycli, setCycli] = useState(0);
  const [sessieTijd, setSessieTijd] = useState(0);
  const [sessieDuur, setSessieDuur] = useState(300); // 5 minuten als standaard
  const [geselecteerdeSessieDuur, setGeselecteerdeSessieDuur] = useState('300');
  const [aangepasteSessieDuur, setAangepasteSessieDuur] = useState('');
  const [isInstellingenOpen, setIsInstellingenOpen] = useState(false);
  const [tijdelijkeInstellingen, setTijdelijkeInstellingen] = useState({
    inademTijd: 4,
    vasthoudTijd: 2,
    uitademTijd: 4,
    sessieDuur: 5
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  const animatieRef = useRef(null);
  const sessieTimerRef = useRef(null);
  const laatsteUpdateTijdRef = useRef(null);

  const [voortgangInademen, setVoortgangInademen] = useState(0);
  const [voortgangUitademen, setVoortgangUitademen] = useState(0);

  const [isPauze, setIsPauze] = useState(false);
  const [pauzetijd, setPauzetijd] = useState(0.5);

  const [geselecteerdeOefening, setGeselecteerdeOefening] = useState("4-7-8 techniek");

  const [techniek, setTechniek] = useState('burnout');

  const gaNaarVolgendeFase = useCallback(() => {
    setFase(prevFase => {
      switch (prevFase) {
        case 'inademen':
          setAftellen(Number(vasthoudTijd));
          return 'vasthouden';
        case 'vasthouden':
          setAftellen(Number(uitademTijd));
          return 'uitademen';
        case 'uitademen':
          setAftellen(Number(pauzetijd));
          setIsPauze(true);
          return 'pauze';
        case 'pauze':
          setAftellen(Number(inademTijd));
          setIsPauze(false);
          setCycli(prev => prev + 1);
          return 'inademen';
        default:
          return 'inademen';
      }
    });
    setVoortgang(0);
  }, [inademTijd, uitademTijd, vasthoudTijd, pauzetijd]);

  const updateAdemhaling = useCallback((deltaTime) => {
    setAftellen(prevAftellen => {
      const nieuweAftelling = Math.max(prevAftellen - deltaTime, 0);
      console.log(`Fase: ${fase}, Aftellen: ${nieuweAftelling}, Voortgang: ${voortgang}, isPauze: ${isPauze}, deltaTime: ${deltaTime}`);

      if (nieuweAftelling === 0) {
        gaNaarVolgendeFase();
        return 0; // Dit wordt overschreven door setAftellen in gaNaarVolgendeFase
      }
      return nieuweAftelling;
    });

    if (!isPauze) {
      setVoortgang(prev => {
        let nieuweVoortgang;
        if (fase === 'inademen' || fase === 'uitademen') {
          nieuweVoortgang = Math.min(prev + (deltaTime / (fase === 'inademen' ? inademTijd : uitademTijd)), 1);
        } else {
          nieuweVoortgang = prev; // Blijft hetzelfde tijdens vasthouden
        }
        console.log(`Voortgang update: ${prev} -> ${nieuweVoortgang}`);
        return nieuweVoortgang;
      });
    }
  }, [fase, isPauze, inademTijd, uitademTijd, gaNaarVolgendeFase]);

  const animeer = useCallback((tijd) => {
    if (isActief) {
      const nu = performance.now();
      if (laatsteUpdateTijdRef.current !== null) {
        const deltaTime = (nu - laatsteUpdateTijdRef.current) / 1000;
        updateAdemhaling(deltaTime);
      }
      laatsteUpdateTijdRef.current = nu;
      animatieRef.current = requestAnimationFrame(animeer);
    }
  }, [isActief, updateAdemhaling]);

  useEffect(() => {
    if (isActief) {
      animatieRef.current = requestAnimationFrame(animeer);
      sessieTimerRef.current = setInterval(() => {
        setSessieTijd((prevTijd) => {
          const nieuweTijd = prevTijd + 1;
          if (nieuweTijd >= sessieDuur) {
            setIsActief(false);
            return sessieDuur;
          }
          return nieuweTijd;
        });
      }, 1000);
    } else {
      cancelAnimationFrame(animatieRef.current);
      clearInterval(sessieTimerRef.current);
    }

    return () => {
      cancelAnimationFrame(animatieRef.current);
      clearInterval(sessieTimerRef.current);
    };
  }, [isActief, sessieDuur, animeer]);

  const schakelActief = () => {
    if (!isActief) {
      setFase('inademen');
      setAftellen(inademTijd);
      setVoortgang(0);
      setSessieTijd(0);
      setIsPauze(false);
      laatsteUpdateTijdRef.current = null;
    } else {
      // Stop de sessie
      cancelAnimationFrame(animatieRef.current);
      clearInterval(sessieTimerRef.current);
    }
    setIsActief(!isActief);
  };

  const resetAlles = () => {
    setIsActief(false);
    setFase('inademen');
    setAftellen(4); // Start met inademen
    setCycli(0);
    setSessieTijd(0);
    setVoortgang(0);
    setIsPauze(false);
    setInademTijd(4);
    setVasthoudTijd(7);
    setUitademTijd(8);
    cancelAnimationFrame(animatieRef.current);
    clearInterval(sessieTimerRef.current);
    laatsteUpdateTijdRef.current = null;
  };

  const getCircleAnimation = useCallback(() => {
    const baseScale = 1;
    const maxScale = 1.3;
    
    if (isPauze) {
      return { transform: `scale(${baseScale})` };
    }
    
    if (fase === 'inademen') {
      return { transform: `scale(${baseScale + voortgang * (maxScale - baseScale)})` };
    } else if (fase === 'uitademen') {
      return { transform: `scale(${maxScale - voortgang * (maxScale - baseScale)})` };
    } else { // vasthouden
      return { transform: `scale(${maxScale})` };
    }
  }, [fase, voortgang, isPauze]);

  const getCirkelStijl = useCallback(() => {
    let vulGraad;
    if (isPauze) {
      vulGraad = 0;
    } else if (fase === 'inademen') {
      vulGraad = voortgang;
    } else if (fase === 'uitademen') {
      vulGraad = 1 - voortgang;
    } else { // vasthouden
      vulGraad = 1;
    }
    return {
      background: `conic-gradient(
        var(--soft-pink) ${vulGraad * 360}deg,
        var(--light-green) ${vulGraad * 360}deg
      )`,
    };
  }, [fase, voortgang, isPauze]);

  const openInstellingen = () => {
    setTijdelijkeInstellingen({ inademTijd, vasthoudTijd, uitademTijd, sessieDuur: sessieDuur / 60 });
    setIsInstellingenOpen(true);
  };

  const sluitInstellingen = () => {
    setIsInstellingenOpen(false);
  };

  const slaInstellingenOp = () => {
    setInademTijd(tijdelijkeInstellingen.inademTijd);
    setVasthoudTijd(tijdelijkeInstellingen.vasthoudTijd);
    setUitademTijd(tijdelijkeInstellingen.uitademTijd);
    if (tijdelijkeInstellingen.sessieDuur === 'custom') {
      setSessieDuur(tijdelijkeInstellingen.aangepasteSessieDuur * 60);
    } else {
      setSessieDuur(Number(tijdelijkeInstellingen.sessieDuur) * 60);
    }
    sluitInstellingen();
  };

  const formatTijd = (seconden) => {
    const minuten = Math.floor(seconden / 60);
    const overgeblevenSeconden = seconden % 60;
    return `${minuten}:${overgeblevenSeconden.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (setting, value) => {
    const newValue = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setTijdelijkeInstellingen(prev => ({...prev, [setting]: newValue}));
  };

  const handleSessieDuurChange = (duur) => {
    setTijdelijkeInstellingen(prev => ({...prev, sessieDuur: duur}));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Voeg deze useEffect toe om de faseovergangen te controleren
  useEffect(() => {
    console.log(`Fase gewijzigd naar: ${fase}`);
  }, [fase]);

  const getFaseInstructie = useCallback(() => {
    switch (fase) {
      case 'inademen':
        return 'Adem in door je neus...';
      case 'vasthouden':
        return 'Hou vast...';
      case 'uitademen':
        return 'Adem uit door je mond...';
      case 'pauze':
        return geselecteerdeOefening === "Vierkant ademen" ? 'Hou leeg...' : 'Adem uit door je mond...';
      default:
        return '';
    }
  }, [fase, geselecteerdeOefening]);

  const veranderOefening = (oefeningNaam) => {
    setGeselecteerdeOefening(oefeningNaam);
    const oefening = presetOefeningen[oefeningNaam];
    setInademTijd(oefening.inademen);
    setVasthoudTijd(oefening.vasthouden);
    setUitademTijd(oefening.uitademen);
    setPauzetijd(0.5); // Altijd 0.5 seconden pauze
    resetAlles();
  };

  const toggleInstellingen = () => {
    setIsInstellingenOpen(prevState => !prevState);
  };

  const handleTijdVerandering = (setter) => (e) => {
    const waarde = e.target.value;
    if (waarde === '' || (Number(waarde) >= 0 && Number(waarde) <= 60)) {
      setter(waarde);
    }
  };

  const handleSessieDuurVerandering = (e) => {
    const waarde = e.target.value;
    setGeselecteerdeSessieDuur(waarde);
    if (waarde === 'aangepast') {
      setAangepasteSessieDuur('');
    } else {
      setSessieDuur(Number(waarde));
      setAangepasteSessieDuur('');
    }
  };

  const handleAangepasteSessieDuurVerandering = (e) => {
    const waarde = e.target.value;
    if (waarde === '' || (/^\d+$/.test(waarde) && Number(waarde) > 0 && Number(waarde) <= 120)) {
      setAangepasteSessieDuur(waarde);
      if (waarde !== '') {
        setSessieDuur(Number(waarde) * 60); // Zet minuten om naar seconden
      }
    }
  };

  const handleTechniekVerandering = (e) => {
    const nieuweTechniek = e.target.value;
    setTechniek(nieuweTechniek);
    
    switch(nieuweTechniek) {
      case 'burnout':
        setInademTijd('4');
        setVasthoudTijd('7');
        setUitademTijd('8');
        setPauzetijd('0.5');
        break;
      case 'vierkant':
        setInademTijd('4');
        setVasthoudTijd('4');
        setUitademTijd('4');
        setPauzetijd('4');
        break;
      case 'ontspanning':
        setInademTijd('5');
        setVasthoudTijd('10');
        setUitademTijd('10');
        setPauzetijd('0.5');
        break;
      default:
        // Standaard waarden of laat de huidige waarden ongewijzigd
        break;
    }
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      <button onClick={toggleDarkMode} className="dark-mode-toggle">
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      
      <h1 className="title">Lieve Amanda</h1>
      <p className="message">
        Adem rustig. Je bent veilig. Er wordt van je gehouden. Het wordt beter. Je bent sterker dan je denkt!
      </p>
      
      <h2 className="subtitle">{getFaseInstructie()}</h2>
      
      <div className="breathing-circle" style={getCirkelStijl()}>
        <div className="inner-circle" style={getCircleAnimation()}>
          <div className="countdown">
            {fase !== 'pauze' ? Math.ceil(aftellen) : ''}
          </div>
        </div>
      </div>
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{width: `${(sessieTijd / sessieDuur) * 100}%`}}
        ></div>
      </div>
      <p className="remaining-time">
        Resterende tijd: {Math.floor((sessieDuur - sessieTijd) / 60)}:{String(Math.floor((sessieDuur - sessieTijd) % 60)).padStart(2, '0')}
      </p>
      <div className="stats">
        <p>Cycli: {cycli}</p>
        <p>Sessietijd: {formatTijd(sessieTijd)}</p>
      </div>
      <div className="controls">
        <button onClick={schakelActief}>{isActief ? 'Stop' : 'Start'}</button>
        <button onClick={resetAlles}>Reset</button>
        <button onClick={toggleInstellingen}>Instellingen</button>
      </div>

      {isInstellingenOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Instellingen</h2>
            <div>
              <label>Ademhalingstechniek: 
                <select value={techniek} onChange={handleTechniekVerandering}>
                  <option value="burnout" title="4-7-8-0.5 seconden">Burnout breathing</option>
                  <option value="vierkant" title="4-4-4-4 seconden">Vierkant ademen</option>
                  <option value="ontspanning" title="5-10-10-0.5 seconden">Ontspanning</option>
                </select>
              </label>
            </div>
            <div>
              <label>Inademen tijd: <input type="text" value={inademTijd} onChange={(e) => setInademTijd(e.target.value)} /></label>
            </div>
            <div>
              <label>Vasthouden tijd: <input type="text" value={vasthoudTijd} onChange={(e) => setVasthoudTijd(e.target.value)} /></label>
            </div>
            <div>
              <label>Uitademen tijd: <input type="text" value={uitademTijd} onChange={(e) => setUitademTijd(e.target.value)} /></label>
            </div>
            <div>
              <label>Pauze tijd: <input type="text" value={pauzetijd} onChange={(e) => setPauzetijd(e.target.value)} /></label>
            </div>
            <div>
              <label>Sessie duur: 
                <select 
                  value={geselecteerdeSessieDuur}
                  onChange={handleSessieDuurVerandering}
                >
                  <option value="180">3 minuten</option>
                  <option value="300">5 minuten</option>
                  <option value="600">10 minuten</option>
                  <option value="900">15 minuten</option>
                  <option value="aangepast">Aangepast</option>
                </select>
              </label>
            </div>
            {geselecteerdeSessieDuur === 'aangepast' && (
              <div>
                <label>Aangepaste duur (minuten): 
                  <input 
                    type="text" 
                    value={aangepasteSessieDuur}
                    onChange={handleAangepasteSessieDuurVerandering}
                    placeholder="Voer minuten in"
                  />
                </label>
              </div>
            )}
            <button onClick={toggleInstellingen}>Sluiten</button>
          </div>
        </div>
      )}

      <select value={techniek} onChange={handleTechniekVerandering}>
        <option value="burnout" title="4-7-8-0.5 seconden">Burnout breathing</option>
        <option value="vierkant" title="4-4-4-4 seconden">Vierkant ademen</option>
        <option value="ontspanning" title="5-10-10-0.5 seconden">Ontspanning</option>
      </select>
    </div>
  );
}

export default App;
