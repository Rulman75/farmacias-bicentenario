import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="max-w-xl w-full p-10 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
        <Image 
          src="/logo-bicentenario.png" 
          alt="Farmacias Bicentenario" 
          width={300} 
          height={95} 
          className="object-contain mb-8 opacity-90" 
          priority 
        />
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Bienvenido al Sistema de Gestión
        </h1>
        <p className="text-slate-500 text-lg">
          Selecciona una opción del menú lateral para comenzar a trabajar.
        </p>
      </div>
    </div>
  );
}
