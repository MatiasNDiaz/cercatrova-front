/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Star } from "lucide-react";

const reviews = [
  { name: "Carlos Gómez", text: "Excelente atención, vendieron mi casa en tiempo récord.", stars: 5, color: "11, 122, 75" }, // #0b7a4b
  { name: "Lucía Pérez", text: "Muy profesionales. Me ayudaron con todo el papeleo legal.", stars: 4, color: "34, 197, 94" },  // #22c55e
  { name: "Martín Sosa", text: "La mejor inmobiliaria de Córdoba, super recomendados.", stars: 5, color: "11, 122, 75" },
  { name: "Elena Ruiz", text: "Encontré el departamento de mis sueños gracias a ellos.", stars: 5, color: "34, 197, 94" },
  { name: "Jorge Paz", text: "Tasación justa y proceso transparente. Muy conforme.", stars: 4, color: "11, 122, 75" },
  { name: "Sofía Milán", text: "Atención personalizada y muy amable por parte del agente.", stars: 5, color: "34, 197, 94" },
  { name: "Raúl Castro", text: "Gran variedad de propiedades y filtros muy útiles.", stars: 5, color: "11, 122, 75" },
  { name: "Ana Clara", text: "El sistema de notificaciones me avisó justo cuando entró la casa.", stars: 4, color: "34, 197, 94" },
  { name: "Pedro Luis", text: "Muy serios y responsables en el manejo documental.", stars: 5, color: "11, 122, 75" },
  { name: "Valeria Dom", text: "Me encantó la sección de favoritos, muy práctica.", stars: 5, color: "34, 197, 94" },
];

export default function Resenas() {
  return (
    <section className="py-28 w-full bg-gray-300  overflow-hidden flex flex-col items-center">
      <div className="text-center mb-16">
        <span className="text-sm tracking-[0.2em] uppercase text-[#0b7a4b] font-medium">Testimonios</span>
        <h2 className="text-4xl md:text-5xl font-semibold mt-4 text-gray-900">Lo que dicen nuestros clientes</h2>
        <div className="w-28 h-0.5 bg-[#0b7a4b] mx-auto mt-8"></div>
      </div>
      
      <div className="wrapper-carousel pb-20">
        <div className="inner-carousel" style={{ "--quantity": reviews.length }}>
          {reviews.map((review, index) => (
            <div 
              key={index} 
              className="card-review" 
              style={{ 
                "--index": index, 
                "--color-card": review.color 
              }}
            >
              <div className="content-review">
                <div className="avatar">
                   <img src={`https://i.pravatar.cc/150?u=${index + 20}`} alt={review.name} />
                </div>
                <h4 className="font-bold text-base text-gray-800 mb-1">{review.name}</h4>
                <p className="text-xs text-gray-600 leading-relaxed italic px-4 mb-4">
                  &quot;{review.text}&quot;
                </p>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      fill={i < review.stars ? "#fbbf24" : "none"} 
                      className={i < review.stars ? "text-yellow-400" : "text-yellow-400"}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .wrapper-carousel {
          width: 100%;
          height: 399px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .inner-carousel {
          --w: 220px;
          --h: 260px;
          /* Radio aumentado para ocupar casi todo el ancho en pantallas grandes */
          --translateZ: clamp(300px, 40vw, 550px); 
          --rotateX: -5deg;
          --perspective: 1500px;
          position: absolute;
          width: var(--w);
          height: var(--h);
          transform-style: preserve-3d;
          transform: perspective(var(--perspective));
          animation: rotating 35s linear infinite;
        }

        .inner-carousel:hover {
          animation-play-state: paused;
        }

        @keyframes rotating {
          from { transform: perspective(var(--perspective)) rotateX(var(--rotateX)) rotateY(0); }
          to { transform: perspective(var(--perspective)) rotateX(var(--rotateX)) rotateY(1turn); }
        }

        .card-review {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(var(--color-card), 0.3);
          border-radius: 30px;
          backdrop-filter: blur(10px);
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          transform: rotateY(calc((360deg / var(--quantity)) * var(--index))) translateZ(var(--translateZ));
          box-shadow: 0 15px 35px rgba(0,0,0,0.08);
          transition: all 0.5s ease;
        }
        
        .card-review:hover {
          border-color: rgba(var(--color-card), 1);
          background: white;
          box-shadow: 0 20px 45px rgba(var(--color-card), 0.15);
        }

        .content-review {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          margin-bottom: 15px;
          border: 3px solid #0b7a4b;
          padding: 3px;
          overflow: hidden;
          background: white;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
      ` }} />
    </section>
  );
}