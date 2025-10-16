import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

// components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import UserList from "./components/users/UserList";
import UserView from "./components/users/UserView";
import MediaList from "./components/media/MediaList";
import MediaView from "./components/media/MediaView";
import CollectionList from "./components/collections/CollectionList";
import CollectionView from "./components/collections/CollectionView";

function App() {
  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/users" element={<UserList/>}/>
        <Route path="/users/:id" element={<UserView/>}/>
        <Route path="/media" element={<MediaList/>}/>
        <Route path="/media/:id" element={<MediaView/>}/>
        <Route path="/collections" element={<CollectionList/>}/>
        <Route path="/collections/:id" element={<CollectionView/>}/>
      </Routes>
      <Footer/>
    </Router>
  )
}

export default App
