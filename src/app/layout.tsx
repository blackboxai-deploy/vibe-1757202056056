import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WhatsApp Auto-Reply Bot',
  description: 'Intelligent WhatsApp bot for automatic customer responses and message management',
  keywords: 'whatsapp, bot, automation, customer service, messaging',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💬</text></svg>" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💬</span>
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">
                        WhatsApp Auto-Reply Bot
                      </h1>
                      <p className="text-sm text-gray-500">
                        Intelligent customer messaging automation
                      </p>
                    </div>
                  </div>
                </div>
                
                <nav className="flex items-center space-x-6">
                  <a 
                    href="/" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/messages" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Messages
                  </a>
                  <a 
                    href="/customers" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Customers
                  </a>
                  <a 
                    href="/settings" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Settings
                  </a>
                  
                  <div className="flex items-center space-x-2 pl-4 border-l border-gray-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div>
                <p>© 2024 WhatsApp Auto-Reply Bot. Built with Next.js and WhatsApp Business API.</p>
              </div>
              <div className="flex items-center space-x-4">
                <span>Status: Active</span>
                <span>•</span>
                <span>Version: 1.0.0</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}