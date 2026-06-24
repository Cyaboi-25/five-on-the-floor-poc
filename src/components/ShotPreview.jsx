import React from 'react';

export default function ShotPreview({ shot, onConfirm, onCancel }) {
  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="shot-preview-zone">{shot.zone.replace('_', ' ').toUpperCase()}</div>
        <div className="shot-preview-quality" style={{ color: shot.quality.color }}>
          {shot.quality.label}
        </div>
        <div className="shot-preview-prob">{shot.probability}%</div>

        <div className="shot-preview-dice">
          {Array.from({ length: shot.dice }, (_, i) => (
            <span key={i} className="die-outline">?</span>
          ))}
          <span className="shot-preview-threshold">need {shot.threshold}+</span>
        </div>

        <div className="shot-preview-points">
          {shot.points === 3 ? '3-POINTER' : '2-POINTER'}
        </div>

        <div className="shot-preview-modifiers">
          {shot.modifiers.map((mod, i) => (
            <div key={i} className="modifier-line">{mod}</div>
          ))}
        </div>

        <div className="shot-preview-buttons">
          <button className="shot-confirm" onClick={onConfirm}>SHOOT IT</button>
          <button className="shot-cancel" onClick={onCancel}>PASS INSTEAD</button>
        </div>
      </div>
    </div>
  );
}
