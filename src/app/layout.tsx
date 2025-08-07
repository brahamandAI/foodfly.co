import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import GoogleOAuthProvider from "@/components/GoogleOAuthProvider";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: "--font-poppins",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FoodFly - Delicious Food Delivery",
  description: "Order your favorite food online and get it delivered to your doorstep.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${poppins.variable} min-h-screen bg-black text-white font-inter antialiased`}>
        <GoogleOAuthProvider>
          <ClientLayout>
              {children}
          </ClientLayout>
        </GoogleOAuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
