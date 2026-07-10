import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const { user, roles, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl text-center">
        <h1 className="font-heading text-5xl sm:text-6xl font-bold mb-4">
          ✨ Mis 15 ✨
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          Plataforma para gestionar fiestas de 15 con countdown, invitados,
          deseos, fotos y regalos.
        </p>

        {!user ? (
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:opacity-90 transition">
              Iniciar sesión
            </Link>
            <p className="w-full text-sm text-muted-foreground mt-6">
              ¿Sos invitado a una fiesta? Escaneá el QR o abrí el link que te enviaron.
            </p>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 inline-block">
            <p className="text-sm text-muted-foreground mb-4">Hola {user.email}</p>
            <div className="flex flex-col gap-3">
              {roles.includes('super_admin') && (
                <Link to="/admin" className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium">
                  🛠️ Panel Super Admin
                </Link>
              )}
              {roles.includes('quinceanera') && (
                <Link to="/mi-fiesta" className="bg-secondary text-secondary-foreground px-6 py-2 rounded-full font-medium">
                  🎂 Mi Fiesta
                </Link>
              )}
              {roles.length === 0 && (
                <p className="text-sm text-muted-foreground">Tu cuenta aún no tiene rol asignado. Pedile al administrador que te habilite.</p>
              )}
              <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground mt-2">Salir</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
