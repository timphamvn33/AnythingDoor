import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import LandingPage from './pages/Landing';
import StorePage from './pages/Store';
import Profile from './pages/Profile';
import Stores from './pages/Stores';
import { Toaster } from 'sonner';
import CartPage from './pages/Cart';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/landing/store/:storeId" element={<StorePage />} />
        <Route path="/landing/stores/owner" element={<Stores />} />
        <Route path="/landing/cart" element={<CartPage />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
