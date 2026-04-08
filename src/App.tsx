import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Fuel from './pages/Fuel';
import Service from './pages/Service';
import Analysis from './pages/Analysis';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/fuel" element={<Fuel />} />
          <Route path="/service" element={<Service />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </Layout>
    </Router>
  );
}
