import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveMobileSubmenu(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  // Navigation groups for better organization
  const navigationGroups = {
    primary: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/attendance', label: 'Attendance', adminOnly: true }
    ],
    management: [
      { to: '/members', label: 'Members', adminOnly: true },
      { to: '/signup', label: 'Add User', adminOnly: true }
    ],
    tools: [
      { to: '/attendance/manual', label: 'Manual Entry', adminOrMentor: true },
      { to: '/attendance/history', label: 'History', adminOrMentor: true }
    ],
    system: [
      { to: '/system-status', label: 'System', adminOnly: true },
      { to: '/device-admin', label: 'Devices', adminOnly: true }
    ]
  };

  const shouldShowLink = (link) => {
    if (link.adminOnly && user?.role !== 'admin') return false;
    if (link.adminOrMentor && !['admin', 'mentor'].includes(user?.role)) return false;
    return true;
  };

  const DropdownMenu = ({ title, links, isOpen, onToggle }) => (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center text-xs tracking-wider uppercase transition-colors duration-200 text-gray-500 hover:text-black group"
      >
        {title}
        <svg 
          className={`ml-1 h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 py-2 bg-white border border-gray-100 rounded-sm shadow-lg min-w-[120px] z-50">
          {links.filter(shouldShowLink).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onToggle()}
              className={({ isActive }) =>
                `block px-4 py-2 text-xs tracking-wider uppercase transition-colors duration-200 ${
                  isActive 
                    ? 'text-black font-medium bg-gray-50' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

  const HamburgerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const ChevronIcon = ({ isOpen }) => (
    <svg 
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const MobileSubmenu = ({ title, links, isActive, onToggle }) => (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-600 hover:text-black hover:bg-gray-100 transition-colors duration-200"
      >
        <span className="text-xs tracking-wider uppercase font-medium">{title}</span>
        <ChevronIcon isOpen={isActive} />
      </button>
      {isActive && (
        <div className="bg-gray-100">
          {links.filter(shouldShowLink).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block px-8 py-3 text-xs tracking-wider uppercase transition-colors duration-200 ${
                  isActive 
                    ? 'text-black font-semibold bg-gray-200' 
                    : 'text-gray-500 hover:text-black hover:bg-gray-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Navigation - Floating */}
      <nav className="hidden lg:block sticky top-4 z-50 px-4">
        <div className="max-w-6xl mx-auto bg-gray-50 border border-gray-200 rounded-full shadow-lg">
          <div className="flex items-center justify-between py-2 px-8">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <h1 className="text-base font-semibold text-black tracking-tight">
                attendee
              </h1>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="flex items-center space-x-6">
              {/* Primary Navigation */}
              {navigationGroups.primary.filter(shouldShowLink).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-xs tracking-wider uppercase transition-colors duration-200 whitespace-nowrap ${
                      isActive 
                        ? 'text-black font-semibold' 
                        : 'text-gray-500 hover:text-black'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {/* Profile Link */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `text-xs tracking-wider uppercase transition-colors duration-200 whitespace-nowrap ${
                    isActive 
                      ? 'text-black font-semibold' 
                      : 'text-gray-500 hover:text-black'
                  }`
                }
              >
                Profile
              </NavLink>

              {/* Grouped Navigation for Admin */}
              {user?.role === 'admin' && (
                <>
                  <DropdownMenu
                    title="Manage"
                    links={navigationGroups.management}
                    isOpen={isDropdownOpen === 'management'}
                    onToggle={() => setIsDropdownOpen(isDropdownOpen === 'management' ? null : 'management')}
                  />
                  
                  <DropdownMenu
                    title="System"
                    links={navigationGroups.system}
                    isOpen={isDropdownOpen === 'system'}
                    onToggle={() => setIsDropdownOpen(isDropdownOpen === 'system' ? null : 'system')}
                  />
                </>
              )}

              {/* Tools for Admin/Mentor */}
              {(user?.role === 'admin' || user?.role === 'mentor') && (
                <DropdownMenu
                  title="Tools"
                  links={navigationGroups.tools}
                  isOpen={isDropdownOpen === 'tools'}
                  onToggle={() => setIsDropdownOpen(isDropdownOpen === 'tools' ? null : 'tools')}
                />
              )}

              {/* User Info & Logout - Desktop */}
              <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
                <div className="text-xs text-gray-500">
                  <span className="capitalize">{user?.role}</span>
                  <span className="mx-2">•</span>
                  <span className="hidden md:inline">{user?.name}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 tracking-wider uppercase hover:text-black transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Floating */}
      <div className="lg:hidden sticky top-4 z-50 px-4 mb-6">
        {/* Mobile Top Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-full shadow-lg px-6 py-2 flex items-center justify-between">
          <h1 className="text-base font-semibold text-black tracking-tight">
            attendee
          </h1>
          
          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-500">
              <span className="capitalize">{user?.role}</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-gray-500 hover:text-black transition-colors duration-200"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Floating Menu */}
        {isMobileMenuOpen && (
          <div className="mt-2 bg-gray-50 border border-gray-200 rounded-3xl shadow-xl max-h-[70vh] overflow-y-auto">
              <div className="py-2">
                {/* Primary Navigation */}
                {navigationGroups.primary.filter(shouldShowLink).map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `block px-6 py-4 text-xs tracking-wider uppercase font-semibold transition-colors duration-200 ${
                        isActive 
                          ? 'text-black bg-gray-100' 
                          : 'text-gray-500 hover:text-black hover:bg-gray-100'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {/* Profile Link */}
                <NavLink
                  to="/profile"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-6 py-4 text-xs tracking-wider uppercase font-semibold transition-colors duration-200 ${
                      isActive 
                        ? 'text-black bg-gray-100' 
                        : 'text-gray-500 hover:text-black hover:bg-gray-100'
                    }`
                  }
                >
                  Profile
                </NavLink>

                {/* Management Submenu for Admin */}
                {user?.role === 'admin' && (
                  <MobileSubmenu
                    title="Manage"
                    links={navigationGroups.management}
                    isActive={activeMobileSubmenu === 'management'}
                    onToggle={() => setActiveMobileSubmenu(
                      activeMobileSubmenu === 'management' ? null : 'management'
                    )}
                  />
                )}

                {/* System Submenu for Admin */}
                {user?.role === 'admin' && (
                  <MobileSubmenu
                    title="System"
                    links={navigationGroups.system}
                    isActive={activeMobileSubmenu === 'system'}
                    onToggle={() => setActiveMobileSubmenu(
                      activeMobileSubmenu === 'system' ? null : 'system'
                    )}
                  />
                )}

                {/* Tools Submenu for Admin/Mentor */}
                {(user?.role === 'admin' || user?.role === 'mentor') && (
                  <MobileSubmenu
                    title="Tools"
                    links={navigationGroups.tools}
                    isActive={activeMobileSubmenu === 'tools'}
                    onToggle={() => setActiveMobileSubmenu(
                      activeMobileSubmenu === 'tools' ? null : 'tools'
                    )}
                  />
                )}

                {/* User Info & Logout */}
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <div className="px-6 py-3 text-xs text-gray-500">
                    <div className="font-semibold text-gray-600">{user?.name}</div>
                    <div className="text-xs text-gray-500 tracking-wider uppercase capitalize">{user?.role}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    className="w-full text-left px-6 py-4 text-xs tracking-wider uppercase font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
    </>
  );
};

export default Navigation;
