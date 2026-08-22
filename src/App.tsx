import React, { useState, useEffect, useMemo } from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useArticles } from './data/dataProvider';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { CreateArticlePage } from './pages/CreateArticlePage';
import { EditArticlePage } from './pages/EditArticlePage';
import { MyArticlesPage } from './pages/MyArticlesPage';
import { AdminPage } from './pages/AdminPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { StaticPages } from './pages/StaticPages';
import { SitemapPage } from './pages/SitemapPage';
import { EmptyState } from './components/common/EmptyState';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AiFloatingButton } from './components/ai/AiFloatingButton';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { MeteorShowerBackground } from './components/common/MeteorShowerBackground';

const MainContent: React.FC = () => {
  const { currentRoute } = useRouter();
  const { articles } = useArticles();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Global custom event listeners to open/close AI assistant from any button or component
  useEffect(() => {
    const handleOpen = () => setIsAiModalOpen(true);
    const handleClose = () => setIsAiModalOpen(false);
    const handleToggle = () => setIsAiModalOpen((prev) => !prev);

    window.addEventListener('thelegendswiki:open-ai', handleOpen);
    window.addEventListener('thelegendswiki:close-ai', handleClose);
    window.addEventListener('thelegendswiki:toggle-ai', handleToggle);

    return () => {
      window.removeEventListener('thelegendswiki:open-ai', handleOpen);
      window.removeEventListener('thelegendswiki:close-ai', handleClose);
      window.removeEventListener('thelegendswiki:toggle-ai', handleToggle);
    };
  }, []);

  // Compute current article details if viewing a wiki page
  const currentArticleInfo = useMemo(() => {
    if (currentRoute.type === 'wiki' && currentRoute.slug) {
      const art = articles.find((a) => a.slug === currentRoute.slug);
      if (art) {
        return {
          title: art.title,
          slug: art.slug,
          summary: art.summary,
          category: art.category,
          content: art.sections
            ? art.sections.map((s) => `${s.title}:\n${(s.content || []).join('\n')}`).join('\n\n')
            : undefined,
        };
      }
    }
    return undefined;
  }, [currentRoute, articles]);

  const renderCurrentView = () => {
    switch (currentRoute.type) {
      case 'home':
        return <HomePage />;

      case 'login':
        return <LoginPage />;

      case 'signup':
        return <SignupPage />;

      case 'forgot-password':
        return <ForgotPasswordPage />;

      case 'reset-password':
        return <ResetPasswordPage oobCode={currentRoute.oobCode} />;

      case 'wiki':
        return <ArticlePage slug={currentRoute.slug} />;

      case 'category':
        return <CategoryPage slug={currentRoute.slug} initialCurtains={currentRoute.curtains} />;

      case 'behind-the-curtains':
        return <CategoryPage slug="behind-the-curtains" initialCurtains={true} />;

      case 'search':
        return (
          <SearchPage
            query={currentRoute.query}
            categoryFilter={currentRoute.category}
            initialLayer={currentRoute.layer}
          />
        );

      case 'sitemap':
        return <SitemapPage />;

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
            requiredRole="admin"
            fallbackTitle="Governance Desk Restricted"
            fallbackDescription="Administrative clearance required to access the encyclopedia moderation desk."
          >
            <AdminPage />
          </ProtectedRoute>
        );

      case 'super-admin':
        return (
          <ProtectedRoute
            requiredRole="super_admin"
            fallbackTitle="Super Admin Control Center Restricted"
            fallbackDescription="Root governance access requires super administrator authorization (michiganshandilya@gmail.com)."
          >
            <SuperAdminPage />
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

      case 'editorial-policy':
        return <StaticPages page="editorial-policy" />;

      case 'content-policy':
        return <StaticPages page="content-policy" />;

      case 'random':
        return <HomePage />;

      case 'notFound':
      default:
        return (
          <div className="py-12">
            <EmptyState
              title="Page Not Found"
              description="The requested encyclopedia entry or path could not be located in our digital archive."
              actionText="Return to Main Desk"
              actionPath="/"
              iconType="search"
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#202122] font-sans relative selection:bg-blue-100 selection:text-blue-900">
      {/* Live Subtle Black Meteor Shower Background over White (Hidden in Print) */}
      <div className="no-print">
        <MeteorShowerBackground />
      </div>

      {/* Skip to Main Content (Accessibility a11y) */}
      <a
        href="#main-content-region"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#3366cc] focus:text-white focus:px-4 focus:py-2 focus:rounded-sm focus:shadow-xl focus:outline-none no-print"
      >
        Skip to main encyclopedic content
      </a>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="no-print">
          <Header />
        </div>
        <div className="flex flex-1 w-full max-w-[1440px] mx-auto">
          <div className="no-print">
            <Sidebar />
          </div>
          <main
            id="main-content-region"
            role="main"
            className="flex-1 bg-white/75 backdrop-blur-[1px] p-4 sm:p-6 lg:p-8 min-w-0 border-l border-[#eaecf0] shadow-xs"
          >
            <div className="max-w-5xl mx-auto">
              {renderCurrentView()}
            </div>
          </main>
        </div>
        <div className="no-print">
          <Footer />
        </div>
      </div>

      {/* Global AI Assistant Floating Trigger at Top-Right & Modal (Hidden in Print) */}
      <div className="no-print">
        <AiFloatingButton
          isOpen={isAiModalOpen}
          onClick={() => setIsAiModalOpen(true)}
        />

        <AiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          currentArticle={currentArticleInfo}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <MainContent />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
