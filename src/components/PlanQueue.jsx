import React from 'react';

const ACTION_LABELS = {
  move:   a => `Move ${a.pieceId?.toUpperCase()} → (${a.toCol},${a.toRow})`,
  pass:   a => `Pass to ${a.receiverId?.toUpperCase()}`,
  screen: a => `Screen by ${a.pieceId?.toUpperCase()}`,
  shoot:  ()  => '🏀 SHOOT',
  hold:   ()  => 'Hold position',
};

const CLOCK_COST = { pass: '1-2 clk', screen: '2 clk', hold: '1 clk', shoot: 'FREE', move: '' };

export default function PlanQueue({ G, moves }) {
  const queue   = G.actionQueue || [];
  const canExec = queue.length > 0;

  const clockColor = G.clock > 12 ? 'var(--make)'
    : G.clock > 6 ? 'var(--offense)'
    : 'var(--miss)';

  return (
    <div className="plan-queue">
      <div className="pq-header">
        <span className="pq-title">PLAY QUEUE</span>
        <span className="pq-clock" style={{ color: clockColor }}>
          ⏱ {G.clock} clk
        </span>
      </div>

      <div className="pq-actions">
        {queue.length === 0
          ? <div className="pq-empty">Queue moves · then EXECUTE</div>
          : queue.map((action, i) => (
            <div key={i} className={`pq-action ${action.type === 'shoot' ? 'pq-action-shoot' : ''}`}>
              <span className="pq-num">{i + 1}</span>
              <span className="pq-desc">
                {ACTION_LABELS[action.type]?.(action) || action.type}
              </span>
              {CLOCK_COST[action.type] && (
                <span className="pq-cost">{CLOCK_COST[action.type]}</span>
              )}
            </div>
          ))
        }
      </div>

      <div className="pq-buttons">
        <button
          className="pq-btn undo"
          onClick={() => moves.undoLastAction()}
          disabled={queue.length === 0}
        >
          UNDO
        </button>
        <button
          className="pq-btn clear"
          onClick={() => moves.clearQueue()}
          disabled={queue.length === 0}
        >
          CLEAR
        </button>
        <button
          className="pq-btn execute"
          onClick={() => moves.execute()}
          disabled={!canExec}
        >
          ▶ EXECUTE
        </button>
      </div>
    </div>
  );
}
