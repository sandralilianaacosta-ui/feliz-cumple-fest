import { store } from './store';

export function seedDemoData() {
  if (localStorage.getItem('birthday_seeded')) return;

  const demoWishes = [
    { message: '¡Que este nuevo año te traiga todo lo que soñás y más! Te quiero mucho.', author: 'Ana', emoji: '💖' },
    { message: 'Felicidades amiga! Que la vida te siga sonriendo como siempre.', author: 'Carlos', emoji: '🎉' },
    { message: 'Un abrazo enorme y que cumplas muchos más rodeada de amor.', author: 'Lucía', emoji: '🥳' },
    { message: 'Sos una persona increíble, te mereces lo mejor del mundo!', author: 'Martín', emoji: '🌟' },
  ];

  demoWishes.forEach(w => {
    store.addWish(w);
  });

  // Auto-approve demo wishes
  store.getWishes().forEach(w => store.approveWish(w.id));

  localStorage.setItem('birthday_seeded', 'true');
}
