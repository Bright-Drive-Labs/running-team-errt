import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
// PENDING IMPORTS
import About from './pages/About'
import Calendar from './pages/Calendar'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Events from './pages/Events'
import EventSuccess from './pages/EventSuccess'
import AdminRoster from './pages/AdminRoster'
import AthletePortal from './pages/AthletePortal'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-deep-black text-foreground">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/training" element={<Calendar />} />
          <Route path="/portal" element={<AthletePortal />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/success" element={<EventSuccess />} />
          <Route path="/admin/roster" element={<AdminRoster />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
