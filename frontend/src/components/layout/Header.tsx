import { Link, useLocation, matchPath } from 'react-router-dom';

const Header = () => {
    const location = useLocation();
    
    const isActive = (pattern: string) => matchPath(pattern, location.pathname) !== null;

    return (
        <header>
            <h1>Header</h1>
            <div style={{display: "flex", flexDirection: "column"}}>
                <Link to="/" style={{
                    backgroundColor: isActive("/") ? "green" : "red"
                }}>
                    /
                </Link>
                <Link to="/users" style={{
                    backgroundColor: isActive("/users") ? "green" : "red"
                }}>
                    /users
                </Link>
                <Link to="/users/1" style={{
                    backgroundColor: isActive("/users/:id") ? "green" : "red"
                }}>
                    /users/:id
                </Link>
                <Link to="/media" style={{
                    backgroundColor: isActive("/media") ? "green" : "red"
                }}>
                    /media
                </Link>
                <Link to="/media/1" style={{
                    backgroundColor: isActive("/media/:id") ? "green" : "red"
                }}>
                    /media/:id
                </Link>
                <Link to="/collections" style={{
                    backgroundColor: isActive("/collections") ? "green" : "red"
                }}>
                    /collections
                </Link>
                <Link to="/collections/1" style={{
                    backgroundColor: isActive("/collections/:id") ? "green" : "red"
                }}>
                    /collections/:id
                </Link>
            </div>
        </header>
    )
};

export default Header;