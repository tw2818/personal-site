import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Tags from './pages/Tags'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/new" element={<ProtectedRoute><NewBlog /></ProtectedRoute>} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/blog/:id/edit" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute><EditProject /></ProtectedRoute>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/tags" element={<Tags />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
