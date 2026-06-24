export function generateRoster() {
  const guaranteed = ['small', 'medium'];
  const pool = ['small', 'small', 'medium', 'medium', 'large', 'large', 'large'];
  const extra = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    extra.push(pool.splice(idx, 1)[0]);
  }
  const sizes = [...guaranteed, ...extra];
  for (let i = sizes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
  }
  return sizes.map((size, i) => ({
    id: `o${i}`,
    size,
    speed: size === 'small' ? 2 : 1,
    card: null,
  }));
}

export function generateCPURoster(difficulty) {
  const configs = {
    rookie:  ['large', 'large', 'medium', 'medium', 'small'],
    pro:     ['large', 'medium', 'medium', 'small', 'small'],
    allstar: null,
    hof:     ['medium', 'medium', 'small', 'small', 'large'],
    legend:  ['medium', 'medium', 'small', 'small', 'large'],
  };
  const sizes = configs[difficulty] || generateRoster().map(p => p.size);
  return sizes.map((size, i) => ({
    id: `d${i}`,
    size,
    speed: 1,
    card: null,
  }));
}
