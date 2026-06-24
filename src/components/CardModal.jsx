import React from 'react';

const SIZE_LABEL = { small: 'S', medium: 'M', large: 'L' };
const STAR_COLOR = { 1: '#8a8799', 2: '#E8A030', 3: '#a060e0' };

export default function CardModal({ G, onClose }) {
  const offense = G.pieces.filter(p => p.role === 'offense');
  const defense = G.pieces.filter(p => p.role === 'defense');

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={e => e.stopPropagation()}>
        <div className="card-modal-header">
          <span className="card-modal-title">ACTIVE CARDS</span>
          <button className="card-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="card-modal-section-title">YOUR OFFENSE</div>
        {offense.map(p => (
          <div key={p.id} className="card-modal-row">
            <div className="card-modal-piece">
              {SIZE_LABEL[p.size]}{p.id.slice(1)}
            </div>
            {p.card ? (
              <div className="card-modal-card">
                <span className="card-modal-name">{p.card.name}</span>
                <span className="card-modal-stars" style={{ color: STAR_COLOR[p.card.stars] }}>
                  {'★'.repeat(p.card.stars)}
                </span>
                <span className="card-modal-desc">{p.card.description}</span>
              </div>
            ) : (
              <div className="card-modal-none">no card</div>
            )}
          </div>
        ))}

        <div className="card-modal-section-title" style={{ marginTop: 10 }}>CPU DEFENSE</div>
        {defense.map(p => (
          <div key={p.id} className="card-modal-row">
            <div className="card-modal-piece" style={{ color: '#4A9EE8' }}>
              {SIZE_LABEL[p.size]}{p.id.slice(1)}
            </div>
            {p.card ? (
              <div className="card-modal-card">
                <span className="card-modal-name">{p.card.name}</span>
                <span className="card-modal-stars" style={{ color: STAR_COLOR[p.card.stars] }}>
                  {'★'.repeat(p.card.stars)}
                </span>
                <span className="card-modal-desc">{p.card.description}</span>
              </div>
            ) : (
              <div className="card-modal-none">no card</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
