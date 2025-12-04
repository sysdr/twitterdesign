import { CostDashboard } from './components/Dashboard/CostDashboard';

function App() {
  const websocketUrl = `ws://localhost:4000/ws`;

  return (
    <div className="App">
      <CostDashboard websocketUrl={websocketUrl} />
    </div>
  );
}

export default App;
