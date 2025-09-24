import './App.css'
import Overview from './components/Overview'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SchoolsPage from './components/SchoolsPage';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/schools" element={<SchoolsPage />} />
      </Routes>
    </Router>
  )
}

export default App
