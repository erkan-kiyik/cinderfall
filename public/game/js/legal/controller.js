// Who is legally responsible for the game (the "data controller" / "veri
// sorumlusu"). Every legal text in the game reads these values, so this is the
// one place to change them. They are shown publicly inside the app.
export const CONTROLLER = {
  name: 'Erkan Kıyık',
  email: 'erkankiyikjr26@gmail.com',
  country: 'TR',              // ISO country of the controller — sets governing law
  game: 'CINDERFALL',
};

// Bump whenever a legal text changes materially. Every player is asked to
// review and accept again on their next launch.
export const LEGAL_VERSION = '2026-10-03';
