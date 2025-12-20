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
      { path: "users/register", element: <Register /> },
      { path: "users/login", element: <Login /> },
      { path: "users/:id", element: <UserView /> },
      { path: "users/:id/edit", element: <UserEdit />},
      { path: "media/upload", element: <MediaUpload />},
      { path: "media", element: <MediaList />},
      { path: "media/:id", element: <MediaView />},
      { path: "media/:id/edit", element: <MediaEdit />},
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;