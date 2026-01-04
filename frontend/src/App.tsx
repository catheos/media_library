import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"

// custom scripts
import { useScrollHistory } from "./hooks/useScrollHistory";

// components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Register from "./components/users/Register";
import Login from "./components/users/Login";
import UserView from "./components/users/UserView";
import UserEdit from "./components/users/UserEdit";
import MediaUpload from "./components/media/MediaUpload";
import MediaList from "./components/media/MediaList";
import MediaView from "./components/media/MediaView";
import MediaEdit from "./components/media/MediaEdit";
import CharacterUpload from "./components/characters/CharacterUpload";
import CharacterView from "./components/characters/CharacterView";
import CharacterList from "./components/characters/CharacterList";
import CharacterEdit from "./components/characters/CharacterEdit";
import MediaCharacterView from "./components/media-character/MediaCharacterView";
import MediaCharacterUpload from "./components/media-character/MediaCharacterUpload";
import MediaCharacterRoleUpload from "./components/media-character/MediaCharacterRoleUpload";
import MediaCharacterRoleView from "./components/media-character/MediaCharacterRoleView";
import MediaUserList from "./components/media-user/MediaUserList";
import MediaUserView from "./components/media-user/MediaUserView";
import MediaUserEdit from "./components/media-user/MediaUserEdit";
import ApisPage from "./components/generic/ApisPage";
import PrivacyPage from "./components/generic/PrivacyPage";

// Layout component
function Layout() {
  useScrollHistory();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "apis", element: <ApisPage /> },
      { path: "privacy", element: <PrivacyPage /> },

      { path: "users/register", element: <Register /> },
      { path: "users/login", element: <Login /> },
      { path: "users/:id", element: <UserView /> },
      { path: "users/:id/edit", element: <UserEdit /> },

      { path: "media/upload", element: <MediaUpload /> },
      { path: "media", element: <MediaList /> },
      { path: "media/:id", element: <MediaView /> },
      { path: "media/:id/edit", element: <MediaEdit /> },

      { path: "characters/upload", element: <CharacterUpload /> },
      { path: "characters/:id", element: <CharacterView /> },
      { path: "characters/:id/edit", element: <CharacterEdit /> },
      { path: "characters", element: <CharacterList /> },

      { path: "media-character/upload", element: <MediaCharacterUpload /> },
      { path: "media-character/:id", element: <MediaCharacterView /> },
      { path: "media-character/roles/upload", element: <MediaCharacterRoleUpload /> },
      { path: "media-character/roles/:id", element: <MediaCharacterRoleView /> },
      { path: "media-user", element: <MediaUserList /> },
      { path: "media-user/:id", element: <MediaUserView /> },
      { path: "media-user/:id/edit", element: <MediaUserEdit /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;