"use client";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Heart,
  User,
  ClipboardCheck, // Nombre profesional para solicitudes
  Building2,
  LogOut,
  Bell
} from "lucide-react";
import { useState } from "react";

export const NavbarPrivate = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Estilo común para los links de la Navbar Desktop
  const navLinkStyle = "group relative px-2 py-2 text-[15px] lg:text-lg font-semibold text-[#0b7a4b] transition-colors duration-300 flex items-center gap-1.5 ";
  const underlineStyle = "absolute -bottom-5  left-0 w-full h-0.5 bg-gradient-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left";

  return (
    <nav className="relative flex flex-row p-2 h-21 justify-between items-center  bg-white shadow-lg rounded-full mt-2 w-full z-50">
      
      {/* 1. LOGO */}
      <div className="flex items-center">
        <Image
          src="/LogoInmobiliaria.png"
          alt="Logo"
          width={140}
          height={130}
          className="bg-white w-30 md:w-32 ml-4 md:ml-7 rounded-full object-contain"
        />
      </div>

      {/* BOTÓN HAMBURGUESA (Móvil) */}
      <button aria-label="menu" onClick={toggleMenu} className="md:hidden p-2 mr-2 text-[#0b7a4b] rounded-2xl hover:bg-[#0f8b57]/10">
        <Menu size={30} />
      </button>

      {/* 2. NAVEGACIÓN DESKTOP (Todo uno al lado del otro) */}
      <ul className="hidden md:flex flex-row gap-1 lg:gap-4 items-center ml-auto mr-4">
        
        <li>
          <Link href="/propiedades" className={navLinkStyle}>
            <Building2 size={18} />
            <span className="relative group-hover:text-[#0f8b57]  ">catálogo</span>
            <span className={underlineStyle} />
          </Link>
        </li>

        <li>
          <Link href="/mis-solicitudes" className={navLinkStyle}>
            <ClipboardCheck size={18} />
            <span className="relative group-hover:text-[#0f8b57]">mis solicitudes</span>
            <span className={underlineStyle} />
          </Link>
        </li>

        <li>
          <Link href="/favoritos" className={navLinkStyle}>
            <Heart size={18} />
            <span className="relative group-hover:text-[#0f8b57]">favoritos</span>
            <span className={underlineStyle} />
          </Link>
        </li>

        <li>
          <Link href="/perfil" className={navLinkStyle}>
            <User size={18} />
            <span className="relative group-hover:text-[#0f8b57]">perfil</span>
            <span className={underlineStyle} />
          </Link>
        </li>
<li>
          <Link href="/dashboard" className={navLinkStyle} >
            <LayoutDashboard size={18} />
            <span className="relative group-hover:text-[#0f8b57]">panel de control</span>
            <span className={underlineStyle} />
          </Link>
        </li>

        {/* Notificaciones (Icono solo) */}
        <li className="ml-2 mr-2">
          <Link href="/notificaciones" className="text-[#0b7a4b] hover:text-[#0f8b57] transition-colors">
            <Bell size={22} />
          </Link>
        </li>

        {/* 3. BOTÓN CERRAR SESIÓN */}
        <li>
           <Link
            href="/login"
            className="
                    relative overflow-hidden flex justify-center items-center px-6 py-2.5 
                    text-lg font-bold text-white 
                    bg-linear-to-r from-[#0f8b57] to-[#14a366] 
                    hover:from-[#0d7a4d] hover:to-[#0f8b57] 
                    rounded-full 
                    active:scale-95 transition-all duration-300
                    group mr-3.5
                    "
          >
            {/* Efecto de brillo (Shine) */}
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out " />

            <LogOut
              size={20}
              className="inline mr-2 transition-transform group-hover:-translate-y-0.5 "
            />

            <span className="relative">cerrar sesión</span>
          </Link>
        </li>
      </ul>

      {/* --- MOBILE SIDEBAR --- */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm shadow transition-opacity duration-300 md:hidden z-60 ${isMenuOpen ? "opacity-100 visible " : "opacity-0 invisible"}`} onClick={toggleMenu} />

      <div className={`fixed top-0 right-0 h-full w-72  bg-white rounded-2xl rounded-tr-none shadow-2xl transform transition-transform duration-300 ease-out md:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full p-6 shadow-2xl w-full pb-11">
          <div className="flex items-center justify-between mb-8 ">
            <span className="font-bold text-[#0b7a4b] text-xl ">Mi Cuenta</span>
            <button aria-label="menu"  onClick={toggleMenu} className="p-2 text-white bg-[#0d9f62] rounded-full"><X size={20} /></button>
          </div>

          <ul className="flex-1 space-y-7 ">
            <li><Link href="/dashboard" onClick={toggleMenu} className="flex text-lg items-center p-3 text-[#0b7a4b] border-b hover:bg-[#0f8b57]/10 rounded-xl"><LayoutDashboard className="mr-4" /> Panel General</Link></li>
            <li><Link href="/propiedades" onClick={toggleMenu} className="flex text-lg items-center p-3 text-[#0b7a4b] border-b hover:bg-[#0f8b57]/10 rounded-xl"><Building2 className="mr-4" /> Catálogo</Link></li>
            <li><Link href="/mis-solicitudes" onClick={toggleMenu} className="flex text-lg items-center p-3 text-[#0b7a4b] border-b hover:bg-[#0f8b57]/10 rounded-xl"><ClipboardCheck className="mr-4" /> Mis Solicitudes</Link></li>
            <li><Link href="/favoritos" onClick={toggleMenu} className="flex text-lg items-center p-3 text-[#0b7a4b] border-b hover:bg-[#0f8b57]/10 rounded-xl"><Heart className="mr-4" /> Favoritos</Link></li>
            <li><Link href="/perfil" onClick={toggleMenu} className="flex text-lg items-center p-3 text-[#0b7a4b] border-b hover:bg-[#0f8b57]/10 rounded-xl"><User className="mr-4" /> Mi Perfil</Link></li>
          </ul>

           <Link
            href="/login"
            className="
                    relative overflow-hidden flex justify-center items-center px-6 py-2.5 
                    text-lg font-bold text-white 
                    bg-linear-to-r from-[#0f8b57] to-[#14a366] 
                    hover:from-[#0d7a4d] hover:to-[#0f8b57] 
                    rounded-full 
                    active:scale-95 transition-all duration-300
                    group
                    "
          >
            {/* Efecto de brillo (Shine) */}
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

            <LogOut
              size={20}
              className="inline mr-2 transition-transform group-hover:-translate-y-0.5"
            />

            <span className="relative">Cerrar sesión</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};