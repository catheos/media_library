import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { title: 'Media', path: '/media' },
  { title: 'Collections', path: '/collections' },
  { title: 'Users', path: '/users' },
];

const Header = () => {
  const { current_user, is_authenticated, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Media Library
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {is_authenticated && navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className="text-sm hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ))}
            
            {is_authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    <User className="h-5 w-5 mr-2" />
                    {current_user?.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={`/users/${current_user?.id}`}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/users/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/users/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {is_authenticated ? (
                  <>
                    <div className="text-lg font-semibold border-b pb-2">
                      {current_user?.username}
                    </div>
                    <Link to={`/users/${current_user?.id}`} className="text-lg">
                      Profile
                    </Link>
                    {navItems.map((item) => (
                      <Link key={item.path} to={item.path} className="text-lg">
                        {item.title}
                      </Link>
                    ))}
                    <Button variant="outline" onClick={logout} className="mt-4">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild>
                      <Link to="/users/login">Login</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/users/register">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;