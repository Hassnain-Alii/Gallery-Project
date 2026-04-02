import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Navbar from './components/Navbar'
import Explore from './pages/Explore'
import Favorites from './pages/Favorites'
import Upload from './pages/Upload'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyUploads from './pages/MyUploads'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/my-uploads" element={<MyUploads />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
