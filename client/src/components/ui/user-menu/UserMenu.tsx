"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, UserCircle, ChevronDown, Wallet } from "lucide-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";

interface UserMenuProps {
  userName: string;
  onLogout: () => void;
  onProfile?: () => void;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
  shouldDisconnectWallet?: boolean;
}

export function UserMenu({ 
  userName, 
  onLogout, 
  onProfile,
  onWalletConnected,
  onWalletDisconnected,
  shouldDisconnectWallet,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    setIsOpen(false);
    if (onProfile) {
      onProfile();
    }
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        title="User Menu"
      >
        <User className="w-4 h-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: "linear-gradient(to bottom, rgba(20, 20, 30, 0.98), rgba(10, 10, 20, 0.98))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-linear-to-r from-violet-500/10 to-fuchsia-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm uppercase">
                  {userName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-gray-400">User Account</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Wallet Connect Button - Mobile Only */}
            <div className="lg:hidden px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-gray-400">Wallet</span>
              </div>
              <WalletConnectButton 
                onConnected={onWalletConnected}
                onDisconnected={onWalletDisconnected}
                shouldDisconnect={shouldDisconnectWallet}
              />
            </div>

            {/* Profile Button */}
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <UserCircle className="w-4 h-4 text-violet-400" />
              <span>My Profile</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
