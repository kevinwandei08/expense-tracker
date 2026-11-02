import { Menu, Bell, UserCircle, LogOut } from 'lucide-react';

function Header({ onMenuClick, title, user, onLogout }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-8">

      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>

          <p className="hidden text-sm text-slate-500 sm:block">
            Manage your personal finances
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">

        <button
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
          <UserCircle size={30} className="text-slate-500" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              {user?.full_name || 'My Account'}
            </p>

            <p className="text-xs text-slate-500">
              {user?.email || 'Personal'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
          title="Sign out"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Logout</span>
        </button>

      </div>
    </header>
  );
}

export default Header;