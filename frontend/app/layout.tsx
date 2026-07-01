import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { Nav } from "@/components/Nav"

export const metadata: Metadata = {
  title: "Halal Trading",
  description: "Algorithmic trading for the halal-conscious investor",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <Nav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
