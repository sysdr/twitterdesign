import React, { useState } from 'react';

interface Props {
  onSimulate: (count: number) => void;
}

export const RequestSimulator: React.FC<Props> = ({ onSimulate }) => {
  const [requestCount, setRequestCount] = useState<number>(100);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    await onSimulate(requestCount);
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <div className="request-simulator">
      <input
        type="number"
        value={requestCount}
        onChange={(e) => setRequestCount(Number(e.target.value))}
        min="1"
        max="10000"
        className="request-input"
      />
      <button
        onClick={handleSimulate}
        disabled={isSimulating}
        className={`simulate-button ${isSimulating ? 'simulating' : ''}`}
      >
        {isSimulating ? 'Simulating...' : `Simulate ${requestCount} Requests`}
      </button>
    </div>
  );
};
