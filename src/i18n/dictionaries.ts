export type Lang = "en" | "es";

export interface Dict {
  nav: {
    home: string;
    story: string;
    details: string;
    party: string;
    travel: string;
    photos: string;
    registry: string;
    faq: string;
    rsvp: string;
  };
  common: {
    language: string;
    loading: string;
    required: string;
    submit: string;
    save: string;
    cancel: string;
    back: string;
    close: string;
  };
  home: {
    kicker: string;
    title: string;
    dateLine: string;
    intro: string;
    countdownLabel: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    rsvpCta: string;
    detailsCta: string;
  };
  story: { title: string; lead: string; timeline: { year: string; body: string }[] };
  details: {
    title: string;
    lead: string;
    scheduleTitle: string;
    schedule: { time: string; label: string }[];
    dressTitle: string;
    dressBody: string;
    venueTitle: string;
    venueBody: string;
  };
  party: { title: string; lead: string };
  travel: {
    title: string;
    lead: string;
    mapTitle: string;
    addressLabel: string;
    hotelsTitle: string;
    hotelsBody: string;
    hotelGroups: { area: string; drive: string; items: { name: string; city: string }[] }[];
    parkingTitle: string;
    parkingBody: string;
    weatherTitle: string;
    weatherLoading: string;
    weatherAvg: string;
    weatherHigh: string;
    weatherLow: string;
    weatherRain: string;
    weatherSunset: string;
    weatherAdvice: string;
  };
  photos: {
    title: string;
    lead: string;
    empty: string;
    uploadTitle: string;
    uploadHint: string;
    uploaderName: string;
    uploaderEmail: string;
    caption: string;
    files: string;
    uploadCta: string;
    uploading: string;
    uploadDone: string;
  };
  registry: { title: string; lead: string };
  faq: { title: string; lead: string; items: { q: string; a: string }[] };
  rsvp: {
    title: string;
    deadlineLine: string;
    closedTitle: string;
    closedBody: string;
    daysLeftToday: string;
    daysLeftOne: string;
    daysLeftMany: string;
    lookupTitle: string;
    lookupHint: string;
    lookupPlaceholder: string;
    lookupCta: string;
    lookupNotFound: string;
    verifyTitle: string;
    verifyHint: string;
    verifyPlaceholder: string;
    verifyCta: string;
    verifying: string;
    verifyInvalid: string;
    verifyLocked: string;
    verifyBack: string;
    addressAddCta: string;
    addressEditCta: string;
    addressSaveCta: string;
    addressSaving: string;
    addressSaved: string;
    addressNotOnFile: string;
    addressCancel: string;
    partyTitle: string;
    partySubtitle: string;
    maxGuestsHint: string;
    tooManyGuests: string;
    addGuest: string;
    remove: string;
    fullName: string;
    adult: string;
    child: string;
    attending: string;
    notAttending: string;
    undecided: string;
    contactTitle: string;
    email: string;
    phone: string;
    message: string;
    submitCta: string;
    submitting: string;
    resubmitNote: string;
    recapTitle: string;
    recapBody: string;
    recapUpdate: string;
    emailSent: string;
    errRequired: string;
    errEmail: string;
    errName: string;
    errNoName: string;
    errGeneric: string;
    errHouseholdNotFound: string;
    errNotVerified: string;
    errRsvpClosed: string;
    errTooManyGuests: string;
    errLinkExpired: string;
    errLinkInvalid: string;
    errSaveFailed: string;
  };
  admin: {
    title: string;
    signOut: string;
    rsvpsTab: string;
    photosTab: string;
    featuresTab: string;
    emailsTab: string;
    totalsAttending: string;
    totalsDeclined: string;
    totalsPending: string;
    totalsAdults: string;
    totalsChildren: string;
    exportCsv: string;
    partyCol: string;
    guestsCol: string;
    contactCol: string;
    submittedCol: string;
    noRsvps: string;
    pending: string;
    approved: string;
    rejected: string;
    approve: string;
    reject: string;
    noPhotos: string;
  };
  auth: {
    title: string;
    email: string;
    password: string;
    submit: string;
    err: string;
    notAdmin: string;
  };
  footer: { made: string };
}

const en: Dict = {
  nav: {
    home: "Home",
    story: "Our Story",
    details: "Details",
    party: "Wedding Party",
    travel: "Travel",
    photos: "Photos",
    registry: "Registry",
    faq: "FAQ",
    rsvp: "RSVP",
  },
  common: {
    language: "Language",
    loading: "Loading…",
    required: "Required",
    submit: "Submit",
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    close: "Close",
  },
  home: {
    kicker: "The Wedding of",
    title: "The Big Day",
    dateLine: "October 10, 2026",
    intro:
      "Welcome to our wedding website — everything you need for the celebration lives here: the schedule, travel details, our registry, and how to RSVP.",
    countdownLabel: "Counting down",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    rsvpCta: "RSVP now",
    detailsCta: "See the details",
  },
  story: {
    title: "Our Story",
    lead: "How we got from a first hello to forever.",
    timeline: [
      { year: "2019", body: "We met." },
      { year: "2021", body: "Made it official." },
      { year: "2024", body: "The yes." },
      { year: "2026", body: "Forever." },
    ],
  },
  details: {
    title: "The Day",
    lead: "Everything happens at Sparks' Barn — ceremony, dinner, dancing.",
    scheduleTitle: "Day-of schedule",
    schedule: [
      { time: "4:30 PM", label: "Guests arrive" },
      { time: "5:00 PM", label: "Ceremony" },
      { time: "5:45 PM", label: "Cocktail hour" },
      { time: "7:00 PM", label: "Dinner & toasts" },
      { time: "8:30 PM", label: "First dance & open floor" },
      { time: "11:30 PM", label: "Send-off" },
    ],
    dressTitle: "Dress code",
    dressBody:
      "Cocktail attire in warm neutrals, lavender, or plum. Skip stilettos — the barn floor is uneven, and the lawn is grass.",
    venueTitle: "The venue",
    venueBody:
      "Sparks' Barn is an open-air barn on farmland outside Louisville, NE. Ceremony is outdoors on the lawn; reception is inside the barn.",
  },
  party: { title: "Wedding Party", lead: "The friends and family standing with us that night." },
  travel: {
    title: "Getting There",
    lead: "Sparks' Barn is in Louisville, Nebraska — about 25 minutes south of Omaha and 40 minutes east of Lincoln.",
    mapTitle: "The venue on the map",
    addressLabel: "Venue address",
    hotelsTitle: "Where to stay",
    hotelsBody:
      "We haven't blocked rooms anywhere. Most out-of-town guests stay in Lincoln or Omaha — here are well-known options in each area.",
    hotelGroups: [
      {
        area: "Closest to the venue (Plattsmouth)",
        drive: "~15 min drive",
        items: [
          { name: "Cobblestone Inn & Suites", city: "Plattsmouth, NE" },
          { name: "American Inn", city: "Plattsmouth, NE" },
        ],
      },
      {
        area: "Lincoln",
        drive: "~40 min drive",
        items: [
          { name: "Graduate by Hilton Lincoln", city: "Downtown Lincoln" },
          { name: "Hilton Garden Inn Lincoln Downtown / Haymarket", city: "Haymarket, Lincoln" },
          { name: "Hyatt Place Lincoln / Haymarket", city: "Haymarket, Lincoln" },
          { name: "Hampton Inn Lincoln South", city: "South Lincoln (near I-80)" },
        ],
      },
      {
        area: "Omaha / Airport (OMA)",
        drive: "~30–40 min drive",
        items: [
          { name: "Hilton Omaha Downtown", city: "Downtown Omaha" },
          { name: "Hyatt Place Omaha / Downtown - Old Market", city: "Old Market, Omaha" },
          { name: "Hampton Inn & Suites Omaha - Downtown", city: "Downtown Omaha" },
          { name: "Courtyard by Marriott Omaha East / Council Bluffs", city: "Near OMA airport" },
        ],
      },
    ],
    parkingTitle: "Parking",
    parkingBody:
      "Free on-site parking. You can leave a car overnight if you're getting a ride home.",
    weatherTitle: "What to pack",
    weatherLoading: "Checking the forecast…",
    weatherAvg: "Typical early October",
    weatherHigh: "High",
    weatherLow: "Low",
    weatherRain: "Chance of rain",
    weatherSunset: "Sunset",
    weatherAdvice:
      "The ceremony is outdoors and the barn cools off fast after sunset. Bring a light jacket or wrap and shoes you can walk on grass in.",
  },
  photos: {
    title: "Photos",
    lead: "A shared gallery, coming after the wedding. We'll open uploads closer to the day.",
    empty: "Photos will appear here after the wedding.",
    uploadTitle: "Share a photo",
    uploadHint: "Up to 5 images, JPG or PNG, 10 MB each. Nothing goes public until we approve it.",
    uploaderName: "Your name",
    uploaderEmail: "Email (optional)",
    caption: "Caption (optional)",
    files: "Choose photos",
    uploadCta: "Upload",
    uploading: "Uploading…",
    uploadDone: "Thank you — your photos are pending approval.",
  },
  registry: {
    title: "Registry",
    lead: "Your presence is the gift. If you'd like to do more, these are the places we've registered.",
  },
  faq: {
    title: "FAQ",
    lead: "The questions we've been getting most.",
    items: [
      {
        q: "Where is the wedding?",
        a: "Sparks' Barn, 13817 108th St, Louisville, NE 68037 — about 25 minutes south of Omaha and 40 minutes east of Lincoln.",
      },
      {
        q: "Can I bring a plus-one?",
        a: "Only if your invitation names a plus-one or the RSVP page lets you add more than one guest. If you're not sure, RSVP with the names listed on your invite and reach out if something's missing.",
      },
      {
        q: "Are kids welcome?",
        a: "Yes. Add them to your party on the RSVP page and mark them as a child so we can plan headcount and meals.",
      },
      {
        q: "What time should I arrive?",
        a: "Doors open at 4:30 PM. The ceremony starts at 5:00 PM sharp — please be seated by 4:55.",
      },
      {
        q: "What's the dress code?",
        a: "Cocktail attire in warm neutrals, lavender, or plum. Skip stilettos — the barn floor is uneven and the ceremony is on grass. Flats or block heels work great.",
      },
      {
        q: "Is it indoors or outdoors?",
        a: "The ceremony is outdoors on the lawn (weather permitting). Cocktails, dinner, and dancing are inside the barn.",
      },
      {
        q: "Where should I stay?",
        a: "We haven't blocked rooms. The Travel section lists well-known hotels in Plattsmouth (closest), Lincoln, and Omaha — pick whatever's easiest for you.",
      },
    ],
  },
  rsvp: {
    title: "RSVP",
    deadlineLine: "Please respond by {date}.",
    daysLeftToday: "Today is the last day to RSVP!",
    daysLeftOne: "1 day left to RSVP",
    daysLeftMany: "{n} days left to RSVP",
    closedTitle: "The RSVP period has closed",
    closedBody:
      "If you still need to reach us, please contact us directly and we'll do our best to accommodate you.",
    lookupTitle: "Find your invitation",
    lookupHint: "Enter your first and last name as it appears on your invite.",
    lookupPlaceholder: "e.g. Alex Rivera",
    lookupCta: "Continue",
    lookupNotFound: "We couldn't find that name. Double-check the spelling or try a nickname.",
    verifyTitle: "Verify your household",
    verifyHint: "Enter the last 4 digits of the phone number on file for your household.",
    verifyPlaceholder: "••••",
    verifyCta: "Continue",
    verifying: "Checking…",
    verifyInvalid: "That doesn't match what we have on file. Please try again.",
    verifyLocked: "Too many attempts. Please wait a bit and try again, or contact us directly.",
    verifyBack: "← Not you? Search again",
    addressAddCta: "Add address",
    addressEditCta: "Edit address",
    addressSaveCta: "Save address",
    addressSaving: "Saving…",
    addressSaved: "Address saved.",
    addressNotOnFile: "We don't have an address on file for you yet.",
    addressCancel: "Cancel",
    partyTitle: "Your party",
    partySubtitle:
      "Update each person, add anyone missing (kids or plus-ones), and let us know who's coming.",
    maxGuestsHint: "You can RSVP for up to {n} people.",
    tooManyGuests: "This invite is for at most {n} guest(s). Please remove someone.",
    addGuest: "+ Add guest",
    remove: "Remove",
    fullName: "Full name",
    adult: "Adult",
    child: "Child",
    attending: "Attending",
    notAttending: "Not attending",
    undecided: "Undecided",
    contactTitle: "Contact info",
    email: "Email",
    phone: "Phone (optional)",
    message: "Note for us (optional)",
    submitCta: "Send RSVP",
    submitting: "Sending…",
    resubmitNote: "Already RSVP'd? Submitting again will update your response.",
    recapTitle: "Thank you — we've got you.",
    recapBody:
      "Here's what we recorded for your party. If anything looks off, use the button below to update it.",
    recapUpdate: "Change our response",
    emailSent: "A confirmation was sent to {email}.",
    errRequired: "Please fill this in.",
    errEmail: "Please enter a valid email.",
    errName: "Please enter each guest's name.",
    errNoName: "Please add at least one guest.",
    errGeneric: "Something went wrong. Please try again in a moment.",
    errHouseholdNotFound: "We couldn't find that household. Please double-check your link.",
    errNotVerified: "Please verify your household again before continuing.",
    errRsvpClosed: "RSVP submissions aren't open yet.",
    errTooManyGuests: "That's more guests than your invitation allows.",
    errLinkExpired: "This edit link has expired. Please contact us for a new one.",
    errLinkInvalid: "This edit link isn't valid. Please double-check it.",
    errSaveFailed: "We couldn't save that. Please try again in a moment.",
  },
  admin: {
    title: "Admin",
    signOut: "Sign out",
    rsvpsTab: "RSVPs",
    photosTab: "Photo queue",
    featuresTab: "Features",
    emailsTab: "Emails",
    totalsAttending: "Attending",
    totalsDeclined: "Declined",
    totalsPending: "Pending",
    totalsAdults: "Adults",
    totalsChildren: "Children",
    exportCsv: "Export CSV",
    partyCol: "Invitation",
    guestsCol: "Guests",
    contactCol: "Contact",
    submittedCol: "Submitted",
    noRsvps: "No RSVPs yet.",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    approve: "Approve",
    reject: "Reject",
    noPhotos: "No photos in this tab.",
  },
  auth: {
    title: "Admin sign-in",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    err: "Invalid email or password.",
    notAdmin: "This account isn't set up as an admin.",
  },
  footer: { made: "Made with love by Geo — 10.10.26" },
};

const es: Dict = {
  nav: {
    home: "Inicio",
    story: "Nuestra historia",
    details: "Detalles",
    party: "Cortejo",
    travel: "Cómo llegar",
    photos: "Fotos",
    registry: "Regalos",
    faq: "Preguntas",
    rsvp: "Confirmar",
  },
  common: {
    language: "Idioma",
    loading: "Cargando…",
    required: "Requerido",
    submit: "Enviar",
    save: "Guardar",
    cancel: "Cancelar",
    back: "Atrás",
    close: "Cerrar",
  },
  home: {
    kicker: "La boda de",
    title: "El gran día",
    dateLine: "10 de octubre de 2026",
    intro:
      "Bienvenidos a nuestro sitio de boda — aquí encontrarán todo para la celebración: el programa, cómo llegar, mesa de regalos y cómo confirmar asistencia.",
    countdownLabel: "En cuenta regresiva",
    days: "días",
    hours: "horas",
    minutes: "minutos",
    seconds: "segundos",
    rsvpCta: "Confirmar asistencia",
    detailsCta: "Ver los detalles",
  },
  story: {
    title: "Nuestra historia",
    lead: "Del primer hola al para siempre.",
    timeline: [
      { year: "2019", body: "Nos conocimos." },
      { year: "2021", body: "Lo hicimos oficial." },
      { year: "2024", body: "El sí." },
      { year: "2026", body: "Para siempre." },
    ],
  },
  details: {
    title: "El día",
    lead: "Todo pasa en Sparks' Barn — ceremonia, cena y baile.",
    scheduleTitle: "Programa del día",
    schedule: [
      { time: "4:30 PM", label: "Llegada de invitados" },
      { time: "5:00 PM", label: "Ceremonia" },
      { time: "5:45 PM", label: "Cóctel" },
      { time: "7:00 PM", label: "Cena y brindis" },
      { time: "8:30 PM", label: "Primer baile" },
      { time: "11:30 PM", label: "Despedida" },
    ],
    dressTitle: "Código de vestimenta",
    dressBody:
      "Cóctel en tonos cálidos, lavanda o ciruela. Evita tacones muy finos — el piso del granero es irregular.",
    venueTitle: "El lugar",
    venueBody:
      "Sparks' Barn es un granero abierto en el campo cerca de Louisville, NE. Ceremonia al aire libre; recepción dentro del granero.",
  },
  party: { title: "Cortejo", lead: "Las personas que estarán con nosotros esa noche." },
  travel: {
    title: "Cómo llegar",
    lead: "Sparks' Barn está en Louisville, Nebraska — a unos 25 minutos al sur de Omaha y 40 minutos al este de Lincoln.",
    mapTitle: "El lugar en el mapa",
    addressLabel: "Dirección del lugar",
    hotelsTitle: "Dónde alojarse",
    hotelsBody:
      "No tenemos bloque de habitaciones. La mayoría de invitados de fuera se quedan en Lincoln o Omaha — aquí van opciones conocidas en cada zona.",
    hotelGroups: [
      {
        area: "Más cerca del lugar (Plattsmouth)",
        drive: "~15 min en auto",
        items: [
          { name: "Cobblestone Inn & Suites", city: "Plattsmouth, NE" },
          { name: "American Inn", city: "Plattsmouth, NE" },
        ],
      },
      {
        area: "Lincoln",
        drive: "~40 min en auto",
        items: [
          { name: "Graduate by Hilton Lincoln", city: "Centro de Lincoln" },
          { name: "Hilton Garden Inn Lincoln Downtown / Haymarket", city: "Haymarket, Lincoln" },
          { name: "Hyatt Place Lincoln / Haymarket", city: "Haymarket, Lincoln" },
          { name: "Hampton Inn Lincoln South", city: "Sur de Lincoln (cerca I-80)" },
        ],
      },
      {
        area: "Omaha / Aeropuerto (OMA)",
        drive: "~30–40 min en auto",
        items: [
          { name: "Hilton Omaha Downtown", city: "Centro de Omaha" },
          { name: "Hyatt Place Omaha / Downtown - Old Market", city: "Old Market, Omaha" },
          { name: "Hampton Inn & Suites Omaha - Downtown", city: "Centro de Omaha" },
          {
            name: "Courtyard by Marriott Omaha East / Council Bluffs",
            city: "Cerca del aeropuerto OMA",
          },
        ],
      },
    ],
    parkingTitle: "Estacionamiento",
    parkingBody:
      "Gratis en el lugar. Puedes dejar el auto durante la noche si vuelves con alguien más.",
    weatherTitle: "Qué llevar",
    weatherLoading: "Consultando el clima…",
    weatherAvg: "Típico de principios de octubre",
    weatherHigh: "Máx.",
    weatherLow: "Mín.",
    weatherRain: "Prob. de lluvia",
    weatherSunset: "Atardecer",
    weatherAdvice:
      "La ceremonia es al aire libre y el granero enfría rápido tras la puesta del sol. Trae una chaqueta ligera y zapatos cómodos para pisar el césped.",
  },
  photos: {
    title: "Fotos",
    lead: "Una galería compartida, disponible después de la boda. Abriremos las subidas cerca del día.",
    empty: "Las fotos aparecerán aquí después de la boda.",
    uploadTitle: "Compartir una foto",
    uploadHint:
      "Hasta 5 imágenes, JPG o PNG, 10 MB cada una. Nada se hace público hasta que lo aprobemos.",
    uploaderName: "Tu nombre",
    uploaderEmail: "Correo (opcional)",
    caption: "Descripción (opcional)",
    files: "Elegir fotos",
    uploadCta: "Subir",
    uploading: "Subiendo…",
    uploadDone: "Gracias — tus fotos están en revisión.",
  },
  registry: {
    title: "Mesa de regalos",
    lead: "Tu presencia es el regalo. Si quieres hacer más, aquí están nuestros registros.",
  },
  faq: {
    title: "Preguntas frecuentes",
    lead: "Lo que más nos preguntan.",
    items: [
      {
        q: "¿Dónde es la boda?",
        a: "Sparks' Barn, 13817 108th St, Louisville, NE 68037 — a unos 25 minutos al sur de Omaha y 40 minutos al este de Lincoln.",
      },
      {
        q: "¿Puedo llevar acompañante?",
        a: "Solo si tu invitación indica +1 o si la página de RSVP te permite agregar más de un invitado. Si no estás seguro, confirma con los nombres de tu invitación y avísanos si falta alguien.",
      },
      {
        q: "¿Se admiten niños?",
        a: "Sí. Agrégalos a tu grupo en la página de RSVP y márcalos como niño para el conteo y la comida.",
      },
      {
        q: "¿A qué hora debo llegar?",
        a: "Las puertas abren a las 4:30 PM. La ceremonia empieza puntual a las 5:00 PM — por favor toma tu lugar antes de las 4:55.",
      },
      {
        q: "¿Cuál es el código de vestimenta?",
        a: "Cóctel en tonos cálidos, lavanda o ciruela. Evita tacones muy finos — el piso del granero es irregular y la ceremonia es sobre césped. Tacón bajo o zapato plano funcionan bien.",
      },
      {
        q: "¿Es al aire libre o dentro?",
        a: "La ceremonia es al aire libre en el jardín (si el clima lo permite). Cóctel, cena y baile son dentro del granero.",
      },
      {
        q: "¿Dónde me hospedo?",
        a: "No tenemos bloque de habitaciones. La sección de Cómo llegar lista hoteles conocidos en Plattsmouth (el más cercano), Lincoln y Omaha — elige el que más te convenga.",
      },
    ],
  },
  rsvp: {
    title: "Confirmar asistencia",
    deadlineLine: "Por favor responde antes del {date}.",
    daysLeftToday: "¡Hoy es el último día para responder!",
    daysLeftOne: "Queda 1 día para responder",
    daysLeftMany: "Quedan {n} días para responder",
    closedTitle: "El plazo para RSVP ha cerrado",
    closedBody: "Si aún necesitas contactarnos, escríbenos directamente y haremos lo posible.",
    lookupTitle: "Encuentra tu invitación",
    lookupHint: "Escribe tu nombre y apellido como aparece en tu invitación.",
    lookupPlaceholder: "ej. Alex Rivera",
    lookupCta: "Continuar",
    lookupNotFound: "No encontramos ese nombre. Revisa la ortografía o intenta con un apodo.",
    verifyTitle: "Verifica tu hogar",
    verifyHint: "Escribe los últimos 4 dígitos del teléfono registrado para tu hogar.",
    verifyPlaceholder: "••••",
    verifyCta: "Continuar",
    verifying: "Verificando…",
    verifyInvalid: "Eso no coincide con lo que tenemos registrado. Intenta de nuevo.",
    verifyLocked:
      "Demasiados intentos. Espera un momento e intenta de nuevo, o contáctanos directamente.",
    verifyBack: "← ¿No eres tú? Buscar de nuevo",
    addressAddCta: "Agregar dirección",
    addressEditCta: "Editar dirección",
    addressSaveCta: "Guardar dirección",
    addressSaving: "Guardando…",
    addressSaved: "Dirección guardada.",
    addressNotOnFile: "Aún no tenemos una dirección registrada para ti.",
    addressCancel: "Cancelar",
    partyTitle: "Tu grupo",
    partySubtitle:
      "Actualiza a cada persona, agrega a quien falte (niños o acompañantes) y dinos quién asistirá.",
    maxGuestsHint: "Puedes confirmar hasta {n} personas.",
    tooManyGuests: "Esta invitación permite máximo {n} invitado(s). Elimina a alguien.",
    addGuest: "+ Agregar invitado",
    remove: "Quitar",
    fullName: "Nombre completo",
    adult: "Adulto",
    child: "Niño",
    attending: "Asistirá",
    notAttending: "No asistirá",
    undecided: "Sin decidir",
    contactTitle: "Datos de contacto",
    email: "Correo",
    phone: "Teléfono (opcional)",
    message: "Mensaje (opcional)",
    submitCta: "Enviar RSVP",
    submitting: "Enviando…",
    resubmitNote: "¿Ya respondiste? Enviar de nuevo actualizará tu respuesta.",
    recapTitle: "Gracias — recibimos tu respuesta.",
    recapBody: "Esto es lo que registramos para tu grupo. Si algo está mal, actualízalo abajo.",
    recapUpdate: "Cambiar respuesta",
    emailSent: "Enviamos una confirmación a {email}.",
    errRequired: "Por favor completa esto.",
    errEmail: "Ingresa un correo válido.",
    errName: "Ingresa el nombre de cada invitado.",
    errNoName: "Agrega al menos un invitado.",
    errGeneric: "Algo salió mal. Intenta de nuevo en un momento.",
    errHouseholdNotFound: "No encontramos ese grupo familiar. Verifica tu enlace.",
    errNotVerified: "Por favor verifica tu grupo familiar de nuevo antes de continuar.",
    errRsvpClosed: "El período para confirmar asistencia aún no ha abierto.",
    errTooManyGuests: "Son más invitados de los que permite tu invitación.",
    errLinkExpired: "Este enlace de edición venció. Contáctanos para uno nuevo.",
    errLinkInvalid: "Este enlace de edición no es válido. Verifícalo de nuevo.",
    errSaveFailed: "No pudimos guardar eso. Intenta de nuevo en un momento.",
  },
  admin: {
    title: "Administración",
    signOut: "Cerrar sesión",
    rsvpsTab: "RSVPs",
    photosTab: "Cola de fotos",
    featuresTab: "Funciones",
    emailsTab: "Correos",
    totalsAttending: "Asistirán",
    totalsDeclined: "No asisten",
    totalsPending: "Pendientes",
    totalsAdults: "Adultos",
    totalsChildren: "Niños",
    exportCsv: "Exportar CSV",
    partyCol: "Grupo",
    guestsCol: "Invitados",
    contactCol: "Contacto",
    submittedCol: "Enviado",
    noRsvps: "Aún no hay RSVPs.",
    pending: "Pendientes",
    approved: "Aprobadas",
    rejected: "Rechazadas",
    approve: "Aprobar",
    reject: "Rechazar",
    noPhotos: "No hay fotos en esta pestaña.",
  },
  auth: {
    title: "Acceso admin",
    email: "Correo",
    password: "Contraseña",
    submit: "Entrar",
    err: "Correo o contraseña incorrectos.",
    notAdmin: "Esta cuenta no es administradora.",
  },
  footer: { made: "Hecho con amor por Geo — 10.10.26" },
};

export const dictionaries: Record<Lang, Dict> = { en, es };
