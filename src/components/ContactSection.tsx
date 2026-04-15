import { Mail, MessageCircle, HelpCircle } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contacto" className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-2">📞 Contacto y Ayuda</h2>
        <p className="text-muted-foreground mb-8">¿Tenés alguna duda o necesitás ayuda?</p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6">
            <Mail className="mx-auto mb-3 text-primary" size={28} />
            <h3 className="font-medium mb-1">Email</h3>
            <p className="text-sm text-muted-foreground">cumple@ejemplo.com</p>
          </div>
          <div className="glass rounded-xl p-6">
            <MessageCircle className="mx-auto mb-3 text-primary" size={28} />
            <h3 className="font-medium mb-1">WhatsApp</h3>
            <p className="text-sm text-muted-foreground">+54 11 1234-5678</p>
          </div>
          <div className="glass rounded-xl p-6">
            <HelpCircle className="mx-auto mb-3 text-primary" size={28} />
            <h3 className="font-medium mb-1">FAQ</h3>
            <p className="text-sm text-muted-foreground">Las fotos son moderadas antes de publicarse</p>
          </div>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">Hecho con 💖 para una celebración inolvidable</p>
      </div>
    </section>
  );
}
