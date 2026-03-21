import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import NewBlog from './pages/NewBlog'
import EditBlog from './pages/EditBlog'
import Projects from './pages/Projects'
import NewProject from './pages/NewProject'
import EditProject from './pages/EditProject'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const pageTransition = {
  duration: 0.35,
  ease: 'easeOut' as const,
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/blog" element={<AnimatedPage><Blog /></AnimatedPage>} />
        <Route path="/blog/new" element={<ProtectedRoute><AnimatedPage><NewBlog /></AnimatedPage></ProtectedRoute>} />
        <Route path="/blog/:id" element={<AnimatedPage><BlogDetail /></AnimatedPage>} />
        <Route path="/blog/:id/edit" element={<ProtectedRoute><AnimatedPage><EditBlog /></AnimatedPage></ProtectedRoute>} />
        <Route path="/projects" element={<AnimatedPage><Projects /></AnimatedPage>} />
        <Route path="/projects/new" element={<ProtectedRoute><AnimatedPage><NewProject /></AnimatedPage></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute><AnimatedPage><EditProject /></AnimatedPage></ProtectedRoute>} />
        <Route path="/profile" element={<AnimatedPage><Profile /></AnimatedPage>} />
        <Route path="/settings" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<ProtectedRoute><AnimatedPage><Admin /></AnimatedPage></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
