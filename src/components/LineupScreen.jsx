import React, { useState } from 'react';
import { generateRoster, generateCPURoster } from '../game/rosterGenerator';
import { rollCard, generateCPUCards } from '../game/cards';

const SIZE_LABEL = { small: 'S', medium: 'M', large: 'L' };
const SIZE_COLOR = { small: '#3dba6e', medium: '#E8A030', large: '#e85050' };
const STAR_COLORS = { 1: '#8a8799', 2: '#E8A030', 3: '#a060e0' };

export default function LineupScreen({ G, moves }) {
  const [roster] = useState(() => generateRoster());
  const [cpuRoster] = useState(() => generateCPURoster(G.difficulty));
  // Roll logic: get 3 cards at once, can re-roll all 3 up to 2 more times
  const [cards, setCards]           = useState(null);   // null or [card, card, card]
  const [rollsUsed, setRollsUsed]   = useState(0);      // 0 = not rolled yet
  const [activeRoll, setActiveRoll] = useState(null);   // which card is selected (0-2)
  const [assignments, setAssignments] = useState({});   // pieceId → cardIndex

  const TOTAL_ROLLS = 3; // 1 initial + 2 re-rolls
  const rollsLeft   = TOTAL_ROLLS - rollsUsed;
  const hasRolled   = rollsUsed > 0;

  function doRoll() {
    if (rollsUsed >= TOTAL_ROLLS) return;
    setCards([rollCard(), rollCard(), rollCard()]);
    setAssignments({});   // re-roll wipes previous assignments
    setActiveRoll(null);
    setRollsUsed(prev => prev + 1);
  }

  function selectRoll(idx) {
    const alreadyAssigned = Object.values(assignments).includes(idx);
    if (alreadyAssigned) return;
    setActiveRoll(activeRoll === idx ? null : idx);
  }

  function handlePieceClick(pieceId) {
    if (activeRoll === null || !cards) return;
    const card = cards[activeRoll];
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
      card: assignments[p.id] !== undefined && cards ? cards[assignments[p.id]] : null,
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
            const card = assignedRollIdx !== undefined && cards ? cards[assignedRollIdx] : null;
            const isEligible = activeRoll !== null && cards?.[activeRoll]?.eligible.includes(p.size);
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
          {hasRolled && (
            <span className="rolls-remaining">
              {rollsLeft > 0 ? `${rollsLeft} re-roll${rollsLeft > 1 ? 's' : ''} left` : 'final draw'}
            </span>
          )}
        </div>

        <div className="rolls-row">
          {Array.from({ length: 3 }, (_, i) => {
            const card = cards?.[i];
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

        {rollsLeft > 0 && (
          <button className="roll-btn" onClick={doRoll}>
            {!hasRolled ? '🎲 ROLL CARDS' : `🎲 RE-ROLL (${rollsLeft - 1} left after this)`}
          </button>
        )}

        {hasRolled && activeRoll !== null && (
          <div className="roll-hint">
            Tap an eligible player above to assign <strong>{cards?.[activeRoll]?.name}</strong>
          </div>
        )}
      </div>

      <button className="confirm-btn" onClick={confirmLineup}>
        CONFIRM LINEUP
      </button>
    </div>
  );
}
