import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from "react-router-dom"

// components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import UserList from "./components/users/UserList";
import UserView from "./components/users/UserView";
import MediaList from "./components/media/MediaList";
import MediaView from "./components/media/MediaView";
import CollectionList from "./components/collections/CollectionList";
import CollectionView from "./components/collections/CollectionView";
import Register from "./components/users/Register";
import Login from "./components/users/Login";
import UserEdit from "./components/users/UserEdit";

// Layout component
function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollRestoration />
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
      { path: "users", element: <UserList /> },
      { path: "users/:id", element: <UserView /> },
      { path: "users/:id/edit", element: <UserEdit />},
      { path: "media", element: <MediaList /> },
      { path: "media/:id", element: <MediaView /> },
      { path: "collections", element: <CollectionList /> },
      { path: "collections/:id", element: <CollectionView /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;