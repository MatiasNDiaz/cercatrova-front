"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Heart,
  User,
  ClipboardCheck,
  Building2,
  LogOut,
  Bell,
} from "lucide-react";
import { useState } from "react";

// ── DATA: links centralizados ─────────────────────────────────────────────────
const navItems = [
  { href: "/properties", label: "catálogo", icon: <Building2 size={18} /> },
  { href: "/mis-solicitudes", label: "mis solicitudes", icon: <ClipboardCheck size={18} /> },
  { href: "/favoritos", label: "favoritos", icon: <Heart size={18} /> },
  { href: "/perfil", label: "perfil", icon: <User size={18} /> },
  { href: "/dashboard", label: "panel de control", icon: <LayoutDashboard size={18} /> },
];

export const NavbarPrivate = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-1 left-0 right-0 z-50 mx-auto w-[95%] flex flex-row p-2.5 justify-between items-center bg-white shadow-lg rounded-full mt-0.5">

      {/* ── LOGO ── */}
      <div className="flex items-center">
        <Link href="/dashboard">
          <Image
            src="/LogoInmobiliaria.png"
            alt="Logo Cerca Trova"
            width={115}
            height={130}
            className="bg-white w-30 object-contain border md:w-30 ml-4 md:ml-8 rounded-full"
          />
        </Link>
      </div>

      {/* ── HAMBURGUESA MOBILE ── */}
      <button
        onClick={toggleMenu}
        aria-label="Abrir navegación"
        className="md:hidden p-2 rounded-2xl mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 active:scale-95 transition-transform"
      >
        <Menu size={30} />
      </button>

      {/* ── DESKTOP NAV ── */}
      <ul className="hidden md:flex flex-row gap-1 lg:gap-3 items-center ml-auto mr-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group relative px-3 py-2 text-[15px] lg:text-lg font-semibold text-[#0b7a4b] transition-colors duration-300 flex items-center gap-1.5"
            >
              {item.icon}
              <span className="relative group-hover:text-[#0f8b57] transition-colors duration-300">
                {item.label}
              </span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
            </Link>
          </li>
        ))}

        {/* Notificaciones */}
        <li className="ml-1 mr-1">
          <Link
            href="/notificaciones"
            aria-label="Notificaciones"
            className="relative p-2 flex items-center text-[#0b7a4b] hover:text-[#0f8b57] hover:bg-[#0f8b57]/10 rounded-full transition-all duration-300"
          >
            <Bell size={22} />
          </Link>
        </li>

        {/* Cerrar sesión */}
        <li>
          <Link
            href="/login"
            className="relative overflow-hidden flex justify-center items-center px-6 py-2.5 text-lg font-bold text-white bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] rounded-full active:scale-95 transition-all duration-300 group mr-3"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <LogOut size={20} className="inline mr-2 transition-transform group-hover:-translate-y-0.5" />
            <span className="relative">cerrar sesión</span>
          </Link>
        </li>
      </ul>

      {/* ── MOBILE: Overlay ── */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={closeMenu}
      />

      {/* ── MOBILE: Drawer ── */}
      <div
        className={`fixed top-0 right-0 h-full w-75 rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">

          {/* Header drawer */}
          <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 shadow-md">
            <span className="font-bold text-[#0b7a4b] text-xl">Mi Cuenta</span>
            <button
              onClick={closeMenu}
              aria-label="Cerrar navegación"
              className="p-2 text-white bg-[#0d9f62] hover:bg-[#0b7a4b] transition-colors rounded-full"
            >
              <X size={25} />
            </button>
          </div>

          {/* Links mobile */}
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                  >
                    <span className="text-[#0b7a4b] shrink-0">{item.icon}</span>
                    <span className="ml-4">{item.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/notificaciones"
                  onClick={closeMenu}
                  className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                >
                  <Bell size={24} className="text-[#0b7a4b] shrink-0" />
                  <span className="ml-4">notificaciones</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Botón cerrar sesión mobile */}
          <div className="flex justify-center items-center p-6 border-t border-gray-100">
            <Link
              href="/login"
              onClick={closeMenu}
              className="relative overflow-hidden w-full flex items-center justify-center py-4 bg-linear-to-r from-[#0f8b57] to-[#14a366] hover:from-[#0d7a4d] hover:to-[#0f8b57] text-white font-bold text-lg rounded-2xl shadow-lg active:scale-[0.97] transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <LogOut size={22} className="mr-2 transition-transform group-hover:-translate-y-0.5" />
              <span className="tracking-wide">cerrar sesión</span>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
};