import React from 'react';

export default function MomentumTrack({ momentum }) {
  const pips = [-2, -1, 0, 1, 2];

  return (
    <div className="momentum-track">
      <span className="momentum-label">MTM</span>
      <div className="momentum-pips">
        {pips.map(val => {
          let cls = 'momentum-pip';
          if (val === momentum) cls += ' momentum-active';
          if (val < 0) cls += ' momentum-cold';
          if (val > 0) cls += ' momentum-hot';
          if (val === 0) cls += ' momentum-neutral';
          return <span key={val} className={cls} />;
        })}
      </div>
    </div>
  );
}
