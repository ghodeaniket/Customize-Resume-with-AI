'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Resume Customizer
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/" label="Home" pathname={pathname} />
            <NavLink href="/resumes" label="Resumes" pathname={pathname} />
            <NavLink href="/job-descriptions" label="Job Descriptions" pathname={pathname} />
            <NavLink href="/customize" label="Customize" pathname={pathname} />
          </nav>
          
          <div className="md:hidden">
            <button className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg
                className="w-6 h-6 text-gray-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  pathname: string;
}

function NavLink({ href, label, pathname }: NavLinkProps) {
  const isActive = pathname === href || 
    (href !== '/' && pathname.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`transition-colors ${
        isActive
          ? 'text-blue-600 font-medium'
          : 'text-gray-600 hover:text-blue-600'
      }`}
    >
      {label}
    </Link>
  );
}