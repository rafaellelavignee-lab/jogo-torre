import React, { useEffect, useState, useCallback, useRef } from "react";

// Assets
const IMG_TORRE = "/torre.png.png";
const IMG_HEROI = "/guerreiro.png.png";
const IMG_DRAGAO = "/dragao.png.png";
const IMG_FUNDO_GUERRA = "https://images.alphacoders.com/514/514930.jpg";

function gerarPergunta(nivelTotal) {
  const estagio = Math.floor((nivelTotal - 1) / 3);
  const a1 = Math.floor(Math.random() * (10 + estagio * 5)) + 1;
  const r = Math.floor(Math.random() * (4 + estagio * 2)) + 1;
  const n = nivelTotal + 2;
  return {
    pergunta: `Qual o ${n}º termo da PA: ${a1}, ${a1 + r}, ${a1 + r * 2}... ?`,
    resposta: a1 + (n - 1) * r
  };
}

export default function App() {
  const [nome, setNome] = useState("");
  const [jogoIniciado, setJogoIniciado] = useState(false);
  const [nivelTotal, setNivelTotal] = useState(1);
  const [playerVida, setPlayerVida] = useState(100);
  const [dragonVida, setDragonVida] = useState(100);
  const [tempoRestante, setTempoRestante] = useState(30);
  const [vitoria, setVitoria] = useState(false);
  const [derrota, setDerrota] = useState(false);
  const [dados, setDados] = useState(() => gerarPergunta(1));
  const [resposta, setResposta] = useState("");
  
  const [shake, setShake] = useState(false);
  const [fogoAtivo, setFogoAtivo] = useState(false);
  const [dragaoAtacando, setDragaoAtacando] = useState(false);
  const [heroiAtacando, setHeroiAtacando] = useState(false);
  
  const [ranking, setRanking] = useState(() => JSON.parse(localStorage.getItem("math_ranks") || "[]"));

  // Áudios Atualizados
  const somDragao = useRef(new Audio("https://www.soundjay.com/creatures/sounds/dragon-roar-1.mp3"));
  const somTick = useRef(new Audio("https://www.soundjay.com/buttons/sounds/button-50.mp3"));
  const somAtaqueHeroi = useRef(new Audio("https://www.soundjay.com/mechanical/sounds/sword-clash-1.mp3"));
  // NOVA MÚSICA CHIPTUNE 8-BIT
  const musicaGuerra = useRef(new Audio("https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3"));

  const handleStart = () => {
    const m = musicaGuerra.current;
    m.loop = true;
    m.volume = 0.2;
    m.play().then(() => setJogoIniciado(true)).catch(() => setJogoIniciado(true));
  };

  const salvarRank = useCallback(() => {
    const novoRank = [...ranking, { nome: nome || "Guerreiro", nivel: nivelTotal }]
      .sort((a, b) => b.nivel - a.nivel)
      .slice(0, 5);
    setRanking(novoRank);
    localStorage.setItem("math_ranks", JSON.stringify(novoRank));
  }, [ranking, nome, nivelTotal]);

  const verificar = useCallback((porTempo = false) => {
    if (vitoria || derrota) return;

    const acertou = !porTempo && parseInt(resposta) === dados.resposta;

    if (acertou) {
      setHeroiAtacando(true);
      somAtaqueHeroi.current.currentTime = 0;
      somAtaqueHeroi.current.play().catch(() => {});
      
      setTimeout(() => setHeroiAtacando(false), 500);

      setDragonVida(v => {
        const novaVida = v - 20;
        if (novaVida <= 0) {
            setVitoria(true);
            return 0;
        }
        return novaVida;
      });
      setNivelTotal(n => n + 1);
      setDados(gerarPergunta(nivelTotal + 1));
    } else {
      somDragao.current.currentTime = 0;
      somDragao.current.play().catch(() => {});
      
      setDragaoAtacando(true);
      setFogoAtivo(true);
      setShake(true);

      setTimeout(() => {
        setDragaoAtacando(false);
        setFogoAtivo(false);
        setShake(false);
      }, 800);

      setPlayerVida(v => {
        const novaVida = v - 25;
        if (novaVida <= 0) {
            setDerrota(true);
            return 0;
        }
        return novaVida;
      });
    }
    setResposta("");
    setTempoRestante(30);
  }, [resposta, dados, nivelTotal, vitoria, derrota]);

  useEffect(() => {
    let intervalo;
    if (jogoIniciado && !vitoria && !derrota) {
      intervalo = setInterval(() => {
        setTempoRestante(prev => {
          if (prev > 1) {
            somTick.current.currentTime = 0;
            somTick.current.volume = 0.1;
            somTick.current.play().catch(() => {});
            return prev - 1;
          }
          verificar(true);
          return 30;
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [jogoIniciado, vitoria, derrota, verificar]);

  useEffect(() => {
    if (vitoria || derrota) {
      salvarRank();
      musicaGuerra.current.pause();
    }
  }, [vitoria, derrota, salvarRank]);

  if (!jogoIniciado || vitoria || derrota) return (
    <div style={styles.menuScreen}>
      <h1 style={styles.mainTitle}>{vitoria ? "🏆 VITÓRIA!" : derrota ? "💀 FIM DE JOGO" : "⚔️ MISSÃO MATEMÁTICA"}</h1>
      <div style={styles.loginBox}>
        {!jogoIniciado ? (
          <>
            <input 
                placeholder="Nome do Herói" 
                style={styles.inputMenu} 
                value={nome} 
                onChange={e => setNome(e.target.value)} 
            />
            <button style={styles.buttonStart} onClick={handleStart}>INICIAR BATALHA</button>
          </>
        ) : (
          <button style={styles.buttonStart} onClick={() => window.location.reload()}>JOGAR NOVAMENTE</button>
        )}
      </div>
      <div style={styles.rankContainer}>
        <h3 style={{color: 'gold'}}>📜 RANKING DOS SÁBIOS</h3>
        {ranking.map((r, i) => (
          <div key={i} style={styles.rankRow}>
            <span>{i+1}º {r.nome}</span>
            <span>Nível {r.nivel}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.gameArea}>
      <div style={{...styles.container, animation: shake ? "shake 0.4s" : "none"}}>
        <div style={styles.backgroundLayer} />
        
        <div style={styles.hud}>
          <div style={styles.hudSide}>
            <div style={styles.label}>{nome || "GUERREIRO"}</div>
            <div style={styles.barOuter}><div style={{...styles.barInner, width: `${playerVida}%`, background: '#0f0'}} /></div>
          </div>
          
          <div style={styles.timerContainer}>
            <span style={{fontSize: '1rem', color: '#fff'}}>TEMPO</span>
            <div style={styles.timerNumber}>{tempoRestante}</div>
          </div>

          <div style={styles.hudSide}>
            <div style={styles.label}>DRAGÃO ANCIÃO</div>
            <div style={styles.barOuter}><div style={{...styles.barInner, width: `${dragonVida}%`, background: '#f00'}} /></div>
          </div>
        </div>

        <div style={styles.battlefield}>
          <img src={IMG_TORRE} style={styles.tower} alt="Torre" />
          
          <img 
            src={IMG_HEROI} 
            style={{
                ...styles.hero,
                animation: heroiAtacando ? "ataqueHeroi 0.5s ease-out" : "flutuarHeroi 4s infinite ease-in-out"
            }} 
            alt="Heroi" 
          />
          
          <img 
            src={IMG_DRAGAO} 
            style={{
              ...styles.dragon,
              animation: dragaoAtacando ? "investida 0.8s ease-in-out" : "flutuar 3s infinite ease-in-out"
            }} 
            alt="Dragao" 
          />

          {fogoAtivo && <div className="fire"></div>}
        </div>

        <div style={styles.questionCard}>
          <div style={{color: 'red', fontWeight: 'bold', marginBottom: '5px'}}>DESAFIO NÍVEL {nivelTotal}</div>
          <p style={{color: '#fff', fontSize: '1.6rem', margin: '10px 0'}}>{dados.pergunta}</p>
          <input 
            autoFocus 
            type="number"
            style={styles.inputGame} 
            value={resposta} 
            onChange={e => setResposta(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && verificar()}
          />
        </div>
      </div>

      <style>{`
        @keyframes shake { 
          0%, 100% { transform: translate(0,0); } 
          25% { transform: translate(-10px, 10px); } 
          75% { transform: translate(10px, -10px); } 
        }
        
        @keyframes flutuar {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }

        /* ANIMAÇÃO DE ESPERA DO HERÓI */
        @keyframes flutuarHeroi {
          0%, 100% { transform: translateY(0px) scaleX(-1); }
          50% { transform: translateY(-15px) scaleX(-1); }
        }

        @keyframes investida {
          0% { transform: translateX(0) scale(1); }
          50% { transform: translateX(-250px) scale(1.3); filter: brightness(1.8) drop-shadow(0 0 15px red); }
          100% { transform: translateX(0) scale(1); }
        }

        @keyframes ataqueHeroi {
          0% { transform: translateX(0) rotate(0deg) scaleX(-1); }
          50% { transform: translateX(400px) rotate(20deg) scale(1.4) scaleX(-1); filter: brightness(2); }
          100% { transform: translateX(0) rotate(0deg) scaleX(-1); }
        }

        .fire { 
          position: absolute; 
          right: 320px; 
          bottom: 180px; 
          width: 100px; 
          height: 100px; 
          background: radial-gradient(circle, #ffcc00, #ff6600, #ff0000);
          border-radius: 50%; 
          filter: blur(12px); 
          animation: shoot 0.8s forwards; 
          z-index: 10;
        }
        
        @keyframes shoot { 
          0% { transform: translateX(0) scale(1); opacity: 1; } 
          100% { transform: translateX(-700px) scale(0.4); opacity: 0; } 
        }
      `}</style>
    </div>
  );
}

const styles = {
  menuScreen: { height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Cinzel", serif, Arial', color: '#fff' },
  mainTitle: { color: '#e63946', fontSize: '4.5rem', marginBottom: '30px', textShadow: '4px 4px #000', textAlign: 'center' },
  loginBox: { background: 'rgba(20, 20, 20, 0.9)', padding: '40px', borderRadius: '20px', border: '2px solid #444', textAlign: 'center', boxShadow: '0 0 30px rgba(255,0,0,0.2)' },
  inputMenu: { padding: '15px', width: '280px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #666', fontSize: '1.1rem', background: '#000', color: '#fff' },
  buttonStart: { width: '100%', padding: '18px', background: '#b22222', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.4rem', borderRadius: '8px', transition: '0.3s' },
  rankContainer: { marginTop: '40px', width: '380px', textAlign: 'center' },
  rankRow: { display: 'flex', justifyContent: 'space-between', color: '#ddd', padding: '10px 0', borderBottom: '1px solid #333', fontSize: '1.1rem' },
  gameArea: { height: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  container: { width: '1150px', height: '800px', position: 'relative', background: '#000', border: '5px solid #222', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 0 50px rgba(0,0,0,1)' },
  backgroundLayer: { position: 'absolute', inset: 0, backgroundImage: `url(${IMG_FUNDO_GUERRA})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 },
  hud: { display: 'flex', justifyContent: 'space-between', padding: '30px', position: 'relative', zIndex: 5, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' },
  hudSide: { width: '280px' },
  timerContainer: { textAlign: 'center' },
  label: { color: '#eee', marginBottom: '10px', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' },
  barOuter: { width: '100%', height: '22px', background: '#1a1a1a', borderRadius: '11px', overflow: 'hidden', border: '2px solid #444' },
  barInner: { height: '100%', transition: '0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  timerNumber: { fontSize: '6.5rem', color: '#ffcc00', fontWeight: 'bold', lineHeight: '1', textShadow: '0 0 25px rgba(255,204,0,0.6)' },
  battlefield: { height: '420px', position: 'relative', zIndex: 2 },
  tower: { position: 'absolute', left: '10px', bottom: '0px', height: '320px', filter: 'drop-shadow(5px 5px 15px #000)' },
  hero: { position: 'absolute', left: '180px', bottom: '30px', height: '280px', zIndex: 3, filter: 'drop-shadow(2px 2px 10px #000)', transition: 'transform 0.1s' },
  dragon: { position: 'absolute', right: '40px', bottom: '40px', height: '280px', zIndex: 3 },
  questionCard: { position: 'relative', zIndex: 5, textAlign: 'center', padding: '25px', background: 'rgba(5,5,5,0.92)', borderTop: '4px solid #b22222', width: '100%', height: '220px' },
  inputGame: { fontSize: '3rem', width: '200px', textAlign: 'center', background: '#000', color: '#ffcc00', border: '2px solid #b22222', borderRadius: '12px', outline: 'none', boxShadow: 'inset 0 0 10px rgba(255,0,0,0.2)' }
};