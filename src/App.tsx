import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { CreateArticlePage } from './pages/CreateArticlePage';
import { EditArticlePage } from './pages/EditArticlePage';
import { MyArticlesPage } from './pages/MyArticlesPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { StaticPages } from './pages/StaticPages';
import { EmptyState } from './components/common/EmptyState';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const MainContent: React.FC = () => {
  const { currentRoute } = useRouter();

  const renderCurrentView = () => {
    switch (currentRoute.type) {
      case 'home':
        return <HomePage />;

      case 'login':
        return <LoginPage />;

      case 'signup':
        return <SignupPage />;

      case 'wiki':
        return <ArticlePage slug={currentRoute.slug} />;

      case 'category':
        return <CategoryPage slug={currentRoute.slug} />;

      case 'search':
        return <SearchPage query={currentRoute.query} categoryFilter={currentRoute.category} />;

      case 'create':
        return (
          <ProtectedRoute fallbackTitle="Authoring Workspace Restricted">
            <CreateArticlePage />
          </ProtectedRoute>
        );

      case 'edit':
        return (
          <ProtectedRoute fallbackTitle="Revision Workspace Restricted">
            <EditArticlePage slug={currentRoute.slug} />
          </ProtectedRoute>
        );

      case 'my-articles':
        return (
          <ProtectedRoute fallbackTitle="Contributor Workspace Restricted">
            <MyArticlesPage />
          </ProtectedRoute>
        );

      case 'user':
        return <UserProfilePage username={currentRoute.username} />;

      case 'admin':
        return (
          <ProtectedRoute
            requiredRole="administrator"
            fallbackTitle="Archival Administration Console Restricted"
          >
            <PlaceholderPage type="admin" />
          </ProtectedRoute>
        );

      case 'about':
        return <StaticPages page="about" />;

      case 'contact':
        return <StaticPages page="contact" />;

      case 'privacy':
        return <StaticPages page="privacy" />;

      case 'terms':
        return <StaticPages page="terms" />;

      case 'random':
        return <HomePage />;

      case 'notFound':
      default:
        return (
          <div className="py-12">
            <EmptyState
              title="Page Not Found"
              description="The requested encyclopedia path does not exist or has been relocated."
              actionText="Return to Main Registry"
              actionPath="/"
              iconType="search"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-[#cbd5e1] font-sans relative selection:bg-blue-600/30 selection:text-blue-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none tech-grid-pattern opacity-40 z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none tech-radial-glow z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1 w-full max-w-[1440px] mx-auto">
          <Sidebar />
          <main className="flex-1 bg-[#080c14]/80 backdrop-blur-xs p-4 sm:p-6 lg:p-8 min-w-0 border-l border-slate-800/40">
            <div className="max-w-5xl mx-auto">
              {renderCurrentView()}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <MainContent />
      </RouterProvider>
    </AuthProvider>
  );
}
