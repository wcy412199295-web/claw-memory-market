import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ContactSidebar from './components/ContactSidebar';
import MarketPage from './pages/MarketPage';
import DetailPage from './pages/DetailPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import FeedbackPage from './pages/FeedbackPage';
import { useStore } from './store';

export default function App() {
  const token = useStore(s => s.token);
  const fetchMe = useStore(s => s.fetchMe);
  const handleGithubCallback = useStore(s => s.handleGithubCallback);

  useEffect(() => {
    // Handle GitHub OAuth redirect (token in URL params)
    handleGithubCallback();
  }, []);

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <div className="min-h-screen bg-mako-100">
      <Header />
      <AuthModal />
      <ContactSidebar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/listing/:id" element={<DetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Routes>
      </main>
    </div>
  );
}
