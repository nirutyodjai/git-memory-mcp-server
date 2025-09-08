import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Ide from './pages/Ide';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import PrdSync from './pages/PrdSync';
import TerminalPage from './pages/Terminal';
import AiCopilot from './pages/AiCopilot';
import ApiDocs from './pages/ApiDocs';
import CodeReview from './pages/CodeReview';
import Tests from './pages/Tests';
import BugFixer from './pages/BugFixer';
import Security from './pages/Security';
import Logs from './pages/Logs';
import Dashboard from './pages/Dashboard';

function Placeholder({ title }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-gray-700">This page is under construction.</p>
    </div>
  );
}

function Home() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Welcome to the Developer Portal</h1>
      <p className="text-gray-700 mb-8">
        This is the central hub for all your development needs. Explore our API documentation, get support, and connect with the community.
      </p>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/projects/new" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow text-center">Create Project</Link>
          <Link to="/projects" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow text-center">Open Project</Link>
          <Link to="/prd/sync" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg shadow text-center">Sync PRD</Link>
          <Link to="/ide" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow text-center">Launch IDE</Link>
          <Link to="/logs" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg shadow text-center">View Logs</Link>
          <Link to="/terminal" className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-lg shadow text-center">Open Terminal</Link>
        </div>
      </section>

      {/* Tools */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Tools</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/ai/copilot" className="border border-gray-300 hover:border-gray-400 text-gray-800 bg-white py-2 px-4 rounded">AI Copilot</Link>
          <Link to="/code-review" className="border border-gray-300 hover:border-gray-400 text-gray-800 bg-white py-2 px-4 rounded">Code Review</Link>
          <Link to="/tests" className="border border-gray-300 hover:border-gray-400 text-gray-800 bg-white py-2 px-4 rounded">Test Runner</Link>
          <Link to="/bug-fixer" className="border border-gray-300 hover:border-gray-400 text-gray-800 bg-white py-2 px-4 rounded">Bug Fixer</Link>
          <Link to="/security" className="border border-gray-300 hover:border-gray-400 text-gray-800 bg-white py-2 px-4 rounded">Security Scan</Link>
        </div>
      </section>
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function TitleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles = {
      '/': 'Home',
      '/api-docs': 'API Docs',
      '/community': 'Community',
      '/support': 'Support',
      '/dashboard': 'Dashboard',
      '/ide': 'NEXUS IDE',
      '/get-started': 'Get Started',
      '/login': 'Login',
      '/projects': 'Projects',
      '/projects/new': 'Create Project',
      '/prd/sync': 'Sync PRD',
      '/logs': 'Logs',
      '/terminal': 'Terminal',
      '/ai/copilot': 'AI Copilot',
      '/code-review': 'Code Review',
      '/tests': 'Test Runner',
      '/bug-fixer': 'Bug Fixer',
      '/security': 'Security Scan',
    };
    const section = titles[pathname] || 'Not Found';
    document.title = `${section} · Developer Portal`;
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <TitleSync />
      <ScrollToTop />
      <Header />
      <main className="p-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/community" element={<Placeholder title="Community" />} />
          <Route path="/support" element={<Placeholder title="Support" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ide" element={<Ide />} />
          <Route path="/get-started" element={<Placeholder title="Get Started" />} />
          <Route path="/login" element={<Placeholder title="Login" />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/prd/sync" element={<PrdSync />} />
          <Route path="/terminal" element={<TerminalPage />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/ai/copilot" element={<AiCopilot />} />
          <Route path="/code-review" element={<CodeReview />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/bug-fixer" element={<BugFixer />} />
          <Route path="/security" element={<Security />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-gray-700">The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default App;
