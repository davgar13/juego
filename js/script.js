(function(){
  // Precalcula todas las imágenes para reutilización
  const symbolImages = [];
  for(let i = 1; i <= 24; i++) {
    const img = new Image();
    img.src = `img/carucel/producto_${i}.webp`;
    img.loading = 'lazy';
    symbolImages.push(img);
  }

  // Cache de elementos del DOM
  const reels = [
    document.getElementById('r1'),
    document.getElementById('r2'), 
    document.getElementById('r3')
  ];
  const spinBtn = document.getElementById('spinBtn');
  const lever = document.getElementById('lever');
  const result = document.getElementById('result');
  const bgMusic = document.getElementById('bg-music');
  const spinSfx = document.getElementById('spin-sfx');
  const winSfx = document.getElementById('win-sfx');
  const loseSfx = document.getElementById('lose-sfx');

  // Variables de estado optimizadas
  let isMuted = false;
  let spinning = false;
  let SYMBOL_HEIGHT = 0;
  const VISIBLE = 1;
  const TOTAL = 30;
  let spinCount = 0;
  let targetIndex = Math.floor(Math.random() * symbolImages.length);

  // Cache de elementos del DOM que se reutilizan
  const symbolCache = new Map();

  // Función optimizada para crear símbolos
  function createSymbol(index) {
    if (symbolCache.has(index)) {
      return symbolCache.get(index).cloneNode(true);
    }
    
    const symbolDiv = document.createElement('div');
    symbolDiv.className = 'symbol';
    
    const imgDiv = document.createElement('div');
    imgDiv.className = 'symbol-img';
    
    // Usar imagen pre-cargada
    const img = symbolImages[index].cloneNode();
    img.alt = '';
    
    imgDiv.appendChild(img);
    symbolDiv.appendChild(imgDiv);
    
    symbolCache.set(index, symbolDiv);
    return symbolDiv.cloneNode(true);
  }

  // Audio optimizado
  bgMusic.volume = 0.18;
  bgMusic.playbackRate = 1;

  function playIfAllowed(audio) {
    if (!isMuted && audio) {
      audio.currentTime = 0;
      try {
        audio.play().catch(() => {});
      } catch(e) {}
    }
  }

  // Generador de resultados más eficiente
  function generateSpinResult() {
    spinCount++;
    let forceProbability = 0;
    if (spinCount === 1) forceProbability = 0.20;
    if (spinCount === 2) forceProbability = 0.50;
    if (spinCount >= 3) forceProbability = 1.00;

    if (Math.random() < forceProbability) {
      spinCount = 0;
      targetIndex = Math.floor(Math.random() * symbolImages.length);
      return [targetIndex, targetIndex, targetIndex];
    }

    // Usar un solo generador de números aleatorios
    return [
      Math.floor(Math.random() * symbolImages.length),
      Math.floor(Math.random() * symbolImages.length),
      Math.floor(Math.random() * symbolImages.length)
    ];
  }

  // Actualizar tamaño optimizado
  function updateReelSize() {
    const reelEl = document.querySelector('.reel');
    if (!reelEl) return SYMBOL_HEIGHT || 100;
    
    const size = Math.round(reelEl.getBoundingClientRect().height);
    SYMBOL_HEIGHT = size;
    document.documentElement.style.setProperty('--reel-size', `${size}px`);
    return size;
  }

  // Debounce para resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const prev = SYMBOL_HEIGHT;
      const newSize = updateReelSize();
      if (newSize !== prev && !spinning) {
        reels.forEach(r => buildReel(r, Math.floor(Math.random() * symbolImages.length)));
      }
    }, 150);
  });

  // Build reel optimizado con requestAnimationFrame
  function buildReel(reel, finalIndex) {
    if (!reel) return;
    
    // Limpiar de forma más eficiente
    while (reel.firstChild) {
      reel.removeChild(reel.firstChild);
    }
    
    // Usar DocumentFragment para actualización batch
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < TOTAL; i++) {
      const idx = (i === TOTAL - 1) ? finalIndex : Math.floor(Math.random() * symbolImages.length);
      const symbol = createSymbol(idx);
      fragment.appendChild(symbol);
    }
    
    reel.appendChild(fragment);
    reel.style.transform = 'translateY(0px)';
    reel.style.transition = 'none';
  }

  // Spin optimizado con requestAnimationFrame
  function spin() {
    if (spinning) return;
    
    spinning = true;
    result.textContent = 'Girando...';
    
    // Forzar layout sincrónico antes de animaciones
    reels.forEach(reel => reel.getBoundingClientRect());
    
    playIfAllowed(spinSfx);
    
    if (bgMusic.paused) {
      playIfAllowed(bgMusic);
    }
    
    const outcomes = generateSpinResult();
    const durations = [2600, 3200, 4000];
    let completed = 0;
    
    reels.forEach((reel, i) => {
      if (!reel) return;
      
      buildReel(reel, outcomes[i]);
      
      // Forzar layout sincrónico
      reel.getBoundingClientRect();
      
      const travel = SYMBOL_HEIGHT * (TOTAL - VISIBLE);
      const finalOffset = SYMBOL_HEIGHT * (TOTAL - 1);
      
      // Usar requestAnimationFrame para animación suave
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durations[i], 1);
        
        if (progress < 1) {
          const y = -travel * progress;
          reel.style.transform = `translateY(${y}px)`;
          requestAnimationFrame(animate);
        } else {
          // Animación final más suave
          reel.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
          reel.style.transform = `translateY(-${finalOffset}px)`;
          
          completed++;
          if (completed === reels.length) {
            setTimeout(() => {
              spinning = false;
              evaluate(outcomes);
            }, 320);
          }
        }
      };
      
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 50 + i * 120);
    });
    
    // Animar palanca
    animateLever();
  }

  // Evaluación optimizada
  function evaluate(outcomes) {
    const [a, b, c] = outcomes;
    
    if (a === b && b === c) {
      playIfAllowed(winSfx);
      result.textContent = '🎉 FELICIDADES! Tres iguales';
      
      // Confetti con throttling
      setTimeout(() => {
        if (window.confetti) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => {
            confetti({ particleCount: 60, spread: 120, origin: { x: 0.2, y: 0.6 } });
            confetti({ particleCount: 60, spread: 120, origin: { x: 0.8, y: 0.6 } });
          }, 100);
        }
      }, 50);
    } else {
      playIfAllowed(loseSfx);
      result.textContent = '😢 Sin suerte';
    }
  }

  // Event listeners optimizados
  if (lever) {
    lever.addEventListener('click', spin);
  }
  
  if (spinBtn) {
    spinBtn.addEventListener('click', spin);
  }

  // Inicialización diferida para mejor performance de carga
  setTimeout(() => {
    updateReelSize();
    reels.forEach(r => {
      if (r) buildReel(r, Math.floor(Math.random() * symbolImages.length));
    });
  }, 100);

  // Limpiar cache cuando sea necesario
  window.addEventListener('beforeunload', () => {
    symbolCache.clear();
  });

})();

/* Generador de monedas aleatorias */
(function(){
  function createRandomCoins(count = 10){
    const container = document.querySelector('.coins');
    if(!container) return;
    container.innerHTML = '';

    for(let i=0;i<count;i++){
      const coin = document.createElement('div');
      coin.className = 'coin';

      const left = Math.random() * 100;
      const topStart = -(Math.random() * 30 + 5);

      // Duración y retraso aleatorios para evitar sincronía
      const duration = (Math.random() * 4 + 4).toFixed(2); 
      const delay = (Math.random() * 3).toFixed(2); 

      const scale = (Math.random() * 0.6 + 0.7).toFixed(2); 
      const rot = Math.floor(Math.random() * 360);

      // Opacidad y z-index aleatorios (para sensación de profundidad)
      const opacity = (Math.random() * 0.25 + 0.75).toFixed(2); 
      const z = Math.floor(Math.random() * 5); 

      coin.style.left = `${left}%`;
      coin.style.top = `${topStart}%`;
      coin.style.width = '';
      coin.style.height = '';
      coin.style.transform = `scale(${scale}) rotate(${rot}deg)`;
      coin.style.opacity = opacity;
      coin.style.zIndex = String(z);
      coin.style.animationDuration = `${duration}s`;
      coin.style.animationDelay = `${delay}s`;

      container.appendChild(coin);
    }
  }

  // Crea las monedas al cargar el script
  createRandomCoins(16);

  let resizeTimeout;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(()=> createRandomCoins(10), 600);
  });

})();