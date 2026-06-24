import React from 'react';
import MenuScreen    from './MenuScreen';
import LineupScreen  from './LineupScreen';
import ScoutScreen   from './ScoutScreen';
import Court         from './Court';
import HUD           from './HUD';
import PlanQueue     from './PlanQueue';
import ActionBar     from './ActionBar';
import MomentumTrack from './MomentumTrack';
import ShotPreview   from './ShotPreview';
import DiceOverlay   from './DiceOverlay';
import ResultScreen  from './ResultScreen';

export default function Board({ G, ctx, moves }) {
  switch (G.gamePhase) {
    case 'menu':   return <MenuScreen moves={moves} />;
    case 'lineup': return <LineupScreen G={G} moves={moves} />;
    case 'scout':  return <ScoutScreen  G={G} moves={moves} />;
    case 'result': return <ResultScreen G={G} moves={moves} />;

    case 'playing':
    default: {
      const selectedPiece = G.pieces.find(p => p.id === G.selectedPieceId);

      return (
        <div className="game-container">
          <HUD G={G} />

          {/* Roster strip — always visible, shows your 5 players + cards */}
          <div className="roster-strip">
            {G.pieces.filter(p => p.role === 'offense').map(p => (
              <div
                key={p.id}
                className={[
                  'roster-strip-piece',
                  G.ballCarrierId === p.id ? 'strip-carrier' : '',
                  G.selectedPieceId === p.id ? 'strip-selected' : '',
                  (G.actionQueue || []).some(a => a.type === 'move' && a.pieceId === p.id) ? 'strip-queued' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => moves.selectPiece(p.id)}
              >
                <div className="strip-badge" style={{
                  background: { small: '#3dba6e', medium: '#E8A030', large: '#e85050' }[p.size],
                }}>
                  {p.size[0].toUpperCase()}{p.id.slice(1)}
                </div>
                {p.card
                  ? <span className="strip-card-name">{p.card.name}</span>
                  : <span className="strip-no-card">—</span>
                }
              </div>
            ))}
          </div>

          <Court G={G} moves={moves} />

          {/* Selected piece card info */}
          {selectedPiece?.card && (
            <div className="selected-card-bar">
              <span className="selected-card-label">CARD:</span>
              <span className="selected-card-name">{selectedPiece.card.name}</span>
              <span className="selected-card-desc">{selectedPiece.card.description}</span>
            </div>
          )}

          {/* Plan queue */}
          <PlanQueue G={G} moves={moves} />

          {/* Special action buttons */}
          <ActionBar G={G} moves={moves} />

          {/* Bottom bar: scheme + momentum */}
          <div className="bottom-bar">
            <div className="scheme-badge">
              {G.cpuScheme === 'zone' ? '🔷 ZONE' : '👤 MAN'}
            </div>
            <MomentumTrack momentum={G.momentum} />
          </div>

          {/* Ball reversal toast */}
          {G.ballReversal && (
            <div className="reversal-toast">
              Ball reversal — shifts the defense
            </div>
          )}

          {/* Overlays */}
          {G.shotPending && (
            <ShotPreview
              shot={G.shotPending}
              onConfirm={() => moves.confirmShot()}
              onCancel={() => moves.cancelShot()}
            />
          )}

          {G.shotResult && (
            <DiceOverlay
              result={G.shotResult}
              onDismiss={() => moves.dismissShotResult()}
            />
          )}

          {G.catchAndShootAvailable && (
            <div className="catch-shoot-prompt">
              <div className="catch-shoot-label">CATCH & SHOOT?</div>
              <div className="catch-shoot-sub">Wide open — free shot</div>
              <div className="catch-shoot-buttons">
                <button onClick={() => moves.catchAndShoot()}>SHOOT</button>
                <button onClick={() => moves.declineCatchAndShoot()}>PASS</button>
              </div>
            </div>
          )}
        </div>
      );
    }
  }
}
