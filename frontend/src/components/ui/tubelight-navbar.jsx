import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Menu, X, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSolana } from "@/context/WalletContext"

export function NavBar({ items, className }) {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { publicKey } = useWallet()
  const { isAdmin } = useSolana()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const walletAddress = publicKey?.toBase58() || null
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : null

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-8 h-16",
          "bg-background/80 border-b border-border/40 backdrop-blur-lg",
          className,
        )}
      >
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 group shrink-0">
          <img
            src="/logo.png"
            alt="GovFund Nepal"
            className="rounded-full object-contain transition-all duration-300 group-hover:brightness-110"
            style={{ width: 'clamp(32px,5vw,40px)', height: 'clamp(32px,5vw,40px)' }}
          />
          <div>
            <span className="font-bold text-lg text-foreground">GovFund</span>
            <span className="hidden sm:inline text-xs text-foreground/50 ml-1">Nepal</span>
          </div>
        </Link>

        {/* Center nav pills — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 bg-background/5 border border-border/50 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.url

            return (
              <Link
                key={item.name}
                to={item.url}
                className={cn(
                  "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors",
                  "text-foreground/80 hover:text-primary",
                  isActive && "bg-muted text-primary",
                )}
              >
                <span className="hidden md:inline">{item.name}</span>
                <span className="md:hidden">
                  <Icon size={18} strokeWidth={2.5} />
                </span>
                {isActive && (
                  <motion.div
                    layoutId="lamp"
                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                      <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                      <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                      <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                    </div>
                  </motion.div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Right side: wallet + hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Wallet button — hidden on mobile, shown on md+ */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-golden/10 text-golden hover:bg-golden/20 transition-colors"
                title="Admin Panel"
              >
                <ShieldCheck size={18} strokeWidth={2} />
              </Link>
            )}
            <WalletMultiButton />
          </div>

          {/* Hamburger menu button — visible only on mobile */}
          <button
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl text-foreground hover:bg-foreground/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* ── Full-screen mobile menu overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[60] flex flex-col"
            style={{
              backgroundColor: '#1A160F',
              borderLeft: '2px solid #8E6F3E',
              borderRight: '2px solid #8E6F3E',
            }}
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-[rgba(142,111,62,0.28)]">
              <Link to="/home" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <img src="/logo.png" alt="GovFund Nepal" className="w-8 h-8 rounded-full object-contain" />
                <span className="font-bold text-lg text-[#F5F1E6]">GovFund Nepal</span>
              </Link>
              <button
                className="flex items-center justify-center w-11 h-11 rounded-xl text-[#F5F1E6] hover:bg-[rgba(142,111,62,0.2)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Mobile nav links */}
            <div className="flex-1 flex flex-col px-4 pt-4 overflow-y-auto">
              {items.map((item, index) => {
                const Icon = item.icon
                const isActive = location.pathname === item.url

                return (
                  <Link
                    key={item.name}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 py-4 text-lg font-medium transition-colors",
                      index < items.length - 1 && "border-b border-[rgba(142,111,62,0.20)]",
                      isActive
                        ? "text-[#FFB81C]"
                        : "text-[#F5F1E6] hover:text-[#FFB81C]",
                    )}
                  >
                    <Icon size={22} strokeWidth={2} />
                    {item.name}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 py-4 text-lg font-medium transition-colors border-t border-[rgba(142,111,62,0.20)]",
                    location.pathname === '/admin'
                      ? "text-[#FFB81C]"
                      : "text-[#F5F1E6] hover:text-[#FFB81C]",
                  )}
                >
                  <ShieldCheck size={22} strokeWidth={2} />
                  Admin
                </Link>
              )}
            </div>

            {/* Mobile wallet section */}
            <div className="px-4 py-6 border-t border-[rgba(142,111,62,0.28)]">
              {shortAddress && (
                <p className="text-xs text-[#C4A96E] mb-3 text-center">
                  Connected: {shortAddress}
                </p>
              )}
              <WalletMultiButton className="!w-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
