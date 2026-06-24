import React, { useState } from 'react';
import { generateRoster, generateCPURoster } from '../game/rosterGenerator';
import { rollCard, generateCPUCards } from '../game/cards';

const SIZE_LABEL = { small: 'S', medium: 'M', large: 'L' };
const SIZE_COLOR = { small: '#3dba6e', medium: '#E8A030', large: '#e85050' };
const STAR_COLORS = { 1: '#8a8799', 2: '#E8A030', 3: '#a060e0' };

export default function LineupScreen({ G, moves }) {
  const [roster] = useState(() => generateRoster());
  const [cpuRoster] = useState(() => generateCPURoster(G.difficulty));
  const [rolls, setRolls] = useState([]);        // up to 3 rolled cards
  const [activeRoll, setActiveRoll] = useState(null);  // index into rolls
  const [assignments, setAssignments] = useState({}); // pieceId → rollIndex

  const rollsLeft = 3 - rolls.length;
  const allRolled = rolls.length === 3;

  function doRoll() {
    if (rolls.length >= 3) return;
    setRolls(prev => [...prev, rollCard()]);
    setActiveRoll(rolls.length); // auto-select the newly rolled card
  }

  function selectRoll(idx) {
    const alreadyAssigned = Object.values(assignments).includes(idx);
    if (alreadyAssigned) return; // already placed
    setActiveRoll(activeRoll === idx ? null : idx);
  }

  function handlePieceClick(pieceId) {
    if (activeRoll === null) return;
    const card = rolls[activeRoll];
    const piece = roster.find(p => p.id === pieceId);
    if (!piece) return;
    if (!card.eligible.includes(piece.size)) return;

    // Remove any existing assignment of this roll index to another piece
    const newAssignments = Object.fromEntries(
      Object.entries(assignments).filter(([, v]) => v !== activeRoll)
    );
    // Remove any previous roll assigned to this piece
    delete newAssignments[pieceId];
    newAssignments[pieceId] = activeRoll;
    setAssignments(newAssignments);
    setActiveRoll(null);
  }

  function removeAssignment(pieceId) {
    const newAssignments = { ...assignments };
    delete newAssignments[pieceId];
    setAssignments(newAssignments);
  }

  function confirmLineup() {
    const finalRoster = roster.map(p => ({
      ...p,
      card: assignments[p.id] !== undefined ? rolls[assignments[p.id]] : null,
    }));
    const finalCPURoster = generateCPUCards(cpuRoster, G.difficulty);
    moves.setRosters(finalRoster, finalCPURoster, [], []);
  }

  return (
    <div className="lineup-screen">
      <div className="lineup-title">BUILD YOUR LINEUP</div>

      {/* Roster */}
      <div className="lineup-section">
        <div className="lineup-section-title">YOUR ROSTER</div>
        <div className="roster-row">
          {roster.map(p => {
            const assignedRollIdx = assignments[p.id];
            const card = assignedRollIdx !== undefined ? rolls[assignedRollIdx] : null;
            const isEligible = activeRoll !== null && rolls[activeRoll]?.eligible.includes(p.size);
            const isIneligible = activeRoll !== null && !isEligible;

            return (
              <div
                key={p.id}
                className={`roster-piece ${isEligible ? 'roster-eligible' : ''} ${isIneligible ? 'roster-ineligible' : ''}`}
                onClick={() => handlePieceClick(p.id)}
              >
                <div className="roster-circle" style={{ background: SIZE_COLOR[p.size] }}>
                  {SIZE_LABEL[p.size]}{p.id.slice(1)}
                </div>
                <div className="roster-size">{p.size}</div>
                <div className="roster-speed">SPD {p.speed}</div>
                {card ? (
                  <div
                    className="roster-card-tag"
                    style={{ color: STAR_COLORS[card.stars] }}
                    onClick={e => { e.stopPropagation(); removeAssignment(p.id); }}
                  >
                    {card.name} ✕
                  </div>
                ) : (
                  <div className="roster-card-empty">no card</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Rolls */}
      <div className="lineup-section">
        <div className="lineup-section-title">
          CARD DRAFT
          <span className="rolls-remaining">
            {rollsLeft > 0 ? `${rollsLeft} roll${rollsLeft > 1 ? 's' : ''} left` : 'all rolled'}
          </span>
        </div>

        <div className="rolls-row">
          {Array.from({ length: 3 }, (_, i) => {
            const card = rolls[i];
            const isActive = activeRoll === i;
            const isAssigned = Object.values(assignments).includes(i);

            if (!card) {
              return (
                <div key={i} className="roll-slot roll-empty">
                  <div className="roll-slot-num">{i + 1}</div>
                  <div className="roll-slot-q">?</div>
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`roll-slot ${isActive ? 'roll-active' : ''} ${isAssigned ? 'roll-assigned' : ''}`}
                onClick={() => selectRoll(i)}
              >
                <div className="roll-card-name">{card.name}</div>
                <div className="roll-card-stars" style={{ color: STAR_COLORS[card.stars] }}>
                  {'★'.repeat(card.stars)}
                </div>
                <div className="roll-card-desc">{card.description}</div>
                <div className="roll-card-eligible">
                  {card.eligible.map(s => SIZE_LABEL[s]).join(' · ')}
                </div>
                {isAssigned && (
                  <div className="roll-assigned-badge">
                    → {roster.find(p => assignments[p.id] === i)?.id?.toUpperCase() || ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!allRolled && (
          <button className="roll-btn" onClick={doRoll}>
            🎲 ROLL {rolls.length + 1} of 3
          </button>
        )}

        {allRolled && activeRoll !== null && (
          <div className="roll-hint">
            Tap an eligible player above to assign <strong>{rolls[activeRoll]?.name}</strong>
          </div>
        )}
      </div>

      <button className="confirm-btn" onClick={confirmLineup}>
        CONFIRM LINEUP
      </button>
    </div>
  );
}
