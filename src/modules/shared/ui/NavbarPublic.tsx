"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Mail,
  Instagram,
  Menu,
  X,
  ArrowLeft,
  Home,
  Briefcase,
  Building2,
  Users2,
  PhoneCallIcon,
  LogIn,
  Users,
  MessageCircle,
} from "lucide-react";
import { BsWhatsapp } from "react-icons/bs";
import { useState } from "react";

export const NavbarPublic = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveSubmenu(null);
  };

  return (
    <nav className="relative flex flex-row p-2 justify-between md:justify-start items-center bg-white shadow-lg rounded-full mt-2 w-full z-50">
      {/* LOGO */}
      <div className="flex items-center">
        <Image
          src="/LogoInmobiliaria.png"
          alt="Logo"
          width={140}
          height={130}
          className="bg-white w-30 2object-contain border md:w-36 ml-4 md:ml-8 rounded-full"
        />
      </div>

      {/* BOTÓN HAMBURGUESA (Móvil) */}
      <button
        onClick={toggleMenu}
        aria-label="Cerrar navegación"
        className="md:hidden p-2 rounded-2xl mr-2 text-[#0b7a4b] hover:bg-[#0f8b57]/10 active:scale-95 transition-transform"
      >
        <Menu size={30} />
      </button>

      {/* --- DESKTOP NAVIGATION (Sin cambios) --- */}
      <ul className="hidden md:flex flex-row gap-4 items-center ml-auto mr-8">
        <li>
          <Link
            href="/login"
            className="group relative px-3 pb-6 py-2 text-lg font-semibold text-[#0b7a4b] transition-colors duration-300"
            >
  {/* Texto del link */}
  <span className="relative group-hover:text-[#0f8b57] transition-colors duration-300">
    <Home size={18} className="inline mr-2 mb-0.5" />
    inicio
  </span>

  {/* Línea animada (Underline Slide) */}
  <span className="absolute -bottom-1 left-2 w-21 h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
 
</Link>
        </li>

        <li className="relative group">
          <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
            <Building2 size={18} className="inline mr-2 mt-1" />
            propiedades{" "}
            <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
          </span>
          <ul className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200  border-gray-100">
            <li>
              <Link
              href="/propiedades/venta"
              className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 rounded-tl-xl rounded-tr-xl"
            >
              Comprar
            </Link>
            </li>
            <li>
              <Link
                href="/propiedades/alquiler"
                 className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300  "
              >
                Alquilar
              </Link>
            </li>
            <li>
              <Link
                href="/propiedades/terrenos"
                className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 "
              >
                Terrenos
              </Link>
            </li>
            <li>
              <Link
                href="/propiedades/destacadas"
                className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 rounded-b-xl "
              
              >
                Destacadas
              </Link>
            </li>
          </ul>
        </li>

        <li className="relative group">
          <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
            <Briefcase size={18} className="inline mr-2 mt-1" />
            servicios{" "}
            <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
          </span>
          <ul className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200  border-gray-100">
            <li>
              <Link
                href="/propiedades/venta"
                 className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 rounded-tl-xl rounded-tr-xl"
              >
                Venta de Propiedades
              </Link>
            </li>
            <li>
              <Link
                href="/propiedades/alquiler"
                 className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 "
              >
                Alquiler de Propiedades
              </Link>
            </li>
            <li>
              <Link
                href="/propiedades/alquiler"
                 className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 "
              >
                Agregamos tu propiedad aqui
              </Link>
            </li>
            <li>
              <Link
                href="/valuacion"
                 className="block px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 rounded-b-xl "
              >
                Valuación de propiedad
              </Link>
            </li>
          </ul>
        </li>

        <li>
          <Link
  href="/login"
  className="group relative px-3 pb-6 py-2 text-lg font-semibold text-[#0b7a4b] transition-colors duration-300"
>
  {/* Texto del link */}
  <span className=" group-hover:text-[#0f8b57] transition-colors  duration-300">
    <Users size={18} className="inline mr-2 mb-0.5" />
    nosotros
  </span>

  {/* Línea animada (Underline Slide) */}
  <span className="absolute -bottom-1 left-0 ml-1.5 w-28 h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
 
</Link>
        </li>

        <li>
          <Link
  href="/login"
  className="group relative px-3 pb-6 py-2 text-lg font-semibold text-[#0b7a4b] transition-colors duration-300"
>
  {/* Texto del link */}
  <span className="relative group-hover:text-[#0f8b57] transition-colors duration-300">
    <MessageCircle size={18} className="inline mr-2 mb-0.5" />
    consultas
  </span>

  {/* Línea animada (Underline Slide) */}
  <span className="absolute -bottom-1 left-0 ml-1.5 w-31 h-0.5 bg-linear-to-r from-[#0f8b57] to-[#14a366] origin-right scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-hover:origin-left" />
 
</Link>
        </li>

        <li className="relative group">
          <span className="flex items-center text-lg font-semibold text-[#0b7a4b] p-2 cursor-pointer">
            <PhoneCallIcon size={18} className="inline mr-2 mt-1" />
            contacto{" "}
            <ChevronDown className="w-4 h-4 ml-1 mt-1 transition-transform group-hover:rotate-180" />
          </span>
          <ul className="absolute left-0 mt-2 w-72 bg-white rounded-xl text-l shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200  border-gray-100">
            <li>
              <a
                href="https://wa.me/543513872817"
                className="flex px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 rounded-tl-xl rounded-tr-xl"
              >
                <BsWhatsapp className="mr-2 ml-0.5 text-xl" /> +54 9 3513
                87-2817
              </a>
            </li>
            <li>
              <a
                href="#"
               className="flex px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 "
              >
                <Instagram className="mr-2" /> Instagram
              </a>
            </li>
            <li>
              <a
                href="mailto:info@ejemplo.com"
                className="flex  px-4 py-3 text-[#0b7a4b] border-l-4 border-transparent hover:border-[#0b7a4b] hover:bg-[#0f8b57]/10 transition-all duration-300 rounded-b-xl "
              >
                <Mail className="mr-2" /> Email
              </a>
            </li>
          </ul>
        </li>

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
                    group
                    "
          >
            {/* Efecto de brillo (Shine) */}
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

            <LogIn
              size={20}
              className="inline mr-2 transition-transform group-hover:-translate-y-0.5"
            />

            <span className="relative">iniciar sesión</span>
          </Link>
        </li>
      </ul>

      {/* --- MOBILE SIDEBAR --- */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden z-60 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={toggleMenu}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-73.5 items-center max-w-sm rounded-2xl rounded-tr-none bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden z-70 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col space-y-1 h-full ">
          {/* Header Drawer */}
          <div className="flex items-center justify-between p-6 border-b-2  border-gray-300 shadow-md">
            <span className="font-bold text-[#0b7a4b] text-xl ">Menú</span>
            <button
              onClick={toggleMenu}
              aria-label="Cerrar navegación"
              className="p-2 text-white bg-[#0d9f62] hover:bg-[#0b7a4b] transition-colors rounded-full"
            >
              <X size={25} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-7 ">
              <li>
                <Link
                  href="/login"
                  onClick={toggleMenu}
                  className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                >
                  <Home size={24} className="text-[#0b7a4b] shrink-0" />

                  {/* Contenedor del texto: Controla la expansión y aparición */}
                  <span className="ml-4 flex items-center whitespace-nowrap">
                    inicio
                  </span>
                </Link>
              </li>

              <li>
                <button
                  onClick={() => setActiveSubmenu("propiedades")}
                  className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    {/* Icono siempre visible */}
                    <Building2 size={24} className="text-[#0b7a4b] shrink-0" />

                    {/* Texto siempre visible con margen fijo */}
                    <span className="ml-4 whitespace-nowrap">propiedades</span>
                  </div>

                  {/* Flecha indicadora de submenú (ChevronRight es más estándar para esto) */}
                  <ArrowLeft className="w-4 h-4 ml-3 mt-1 transition-transform rotate-180" />
                </button>
              </li>

              <li>
                <button
                  onClick={() => setActiveSubmenu("servicios")}
                  className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    {/* Icono: Siempre visible, sirve de ancla */}
                    <Briefcase size={24} className="text-[#0b7a4b] shrink-0" />

                    {/* Contenedor del texto: Controla la expansión y aparición */}
                    <span className="ml-4 whitespace-nowrap">servicios</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 ml-3 mt-1 transition-transform rotate-180" />
                </button>
              </li>

              <li>
                <Link
                  href="/login"
                  onClick={toggleMenu}
                  className="flex items-center p-4 text-xl font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors border-b"
                >
                  <Users2 size={24} className="text-[#0b7a4b] shrink-0" />

                  {/* Contenedor del texto: Controla la expansión y aparición */}
                  <span className="ml-4 flex items-center whitespace-nowrap">
                    nosotros
                  </span>
                </Link>
              </li>

              <li>
                <button
                  onClick={() => setActiveSubmenu("contacto")}
                  className="w-full flex items-center justify-between p-4 text-xl border-b font-medium text-[#0b7a4b] hover:bg-[#0f8b57]/10 rounded-xl transition-colors"
                >
                  <div className="flex items-center">
                    {/* Icono: Siempre visible, sirve de ancla */}
                    <PhoneCallIcon
                      size={24}
                      className="text-[#0b7a4b] shrink-0"
                    />

                    {/* Contenedor del texto: Controla la expansión y aparición */}
                    <span className="ml-4 whitespace-nowrap">contacto</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 ml-3 mt-1 transition-transform rotate-180" />
                </button>
              </li>
            </ul>
          </div>

          <div className="flex justify-center items-center p-6 border-t border-gray-50">
            <Link
              href="/login"
              onClick={toggleMenu}
              className="
      relative overflow-hidden w-full flex items-center justify-center py-4 
      bg-linear-to-r from-[#0f8b57] to-[#14a366] 
      hover:from-[#0d7a4d] hover:to-[#0f8b57] 
      text-white font-bold text-lg rounded-2xl 
      shadow-[0_10px_20px_-10px_rgba(15,139,87,0.5)] 
      active:scale-[0.97] transition-all duration-300
      group
    "
            >
              {/* Efecto de brillo sutil al pasar el mouse */}
              <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

              <LogIn
                size={22}
                className="mr-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />

              <span className="tracking-wide">iniciar sesión</span>
            </Link>
          </div>

          {/* SUBMENÚ LATERAL DESLIZABLE */}
          {["propiedades", "servicios", "contacto"].map((menu) => (
            <div
              key={menu}
              className={`absolute inset-0 rounded-3xl bg-white z-80 transition-transform duration-300 ${activeSubmenu === menu ? "translate-x-0" : "translate-x-full"}`}
            >
              <div className="flex items-center p-5 pb-6 ml-0 border-gray-100 shadow-md">
                <button
                  onClick={() => setActiveSubmenu(null)}
                  aria-label="activar menu "
                  className="p-2 mr-2 text-[#0b7a4b] mt-1 ml-0 hover:bg-[#0f8b57]/10 rounded-full"
                >
                  <ArrowLeft size={24} />
                </button>
                <span className="font-bold text-[#0b7a4b] text-xl capitalize">
                  {menu}
                </span>
              </div>
              <ul className="p-4 space-y-5 ">
                {menu === "propiedades" && (
                  <>
                    <li>
                      <Link
                        href="/propiedades/venta"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Comprar
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/propiedades/alquiler"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Alquilar
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/propiedades/terrenos"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Terrenos
                      </Link>
                    </li>
                  </>
                )}
                {menu === "servicios" && (
                  <>
                    <li>
                      <Link
                        href="/propiedades/venta"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Venta de Propiedades
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/propiedades/alquiler"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Alquiler de Propiedades
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/propiedades/alquiler"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Agrega tu propiedad
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/valuacion"
                        className="block p-4 text-lg text-[#0b7a4b] -700 hover:bg-[#0f8b57]/10 rounded-xl border-l-4 border-[#0b7a4b]"
                      >
                        Valuación Profesional
                      </Link>
                    </li>
                  </>
                )}
                {menu === "contacto" && (
                  <>
                    <li className="p-4 hover:bg-[#0f8b57]/10 rounded-2xl border-l-4 border-[#0b7a4b]">
                      <a
                        href="https://wa.me/543513872817"
                        className="flex  ml-0.5 items-center  text-lg text-[#0b7a4b]"
                      >
                        <BsWhatsapp  className="mr-3 text-xl text-[#0b7a4b]" />{" "}
                        WhatsApp
                      </a>
                    </li>
                    <li className="p-4 hover:bg-[#0f8b57]/10 rounded-2xl border-l-4 border-[#0b7a4b]">
                      <a
                        href="mailto:info@ejemplo.com"
                        className="flex items-center text-lg text-[#0b7a4b]"
                      >
                        <Mail className="mr-3 text-[#0b7a4b]" /> Enviar Email
                      </a>
                    </li>
                    <li className="p-4 hover:bg-[#0f8b57]/10 rounded-2xl border-l-4 border-[#0b7a4b]">
                      <a
                        href="#"
                        className="flex items-center text-lg text-[#0b7a4b] -700"
                      >
                        <Instagram className="mr-3 text-[#0b7a4b]" /> Instagram
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};
