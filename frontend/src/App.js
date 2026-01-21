const menuHighlights = [
  {
    title: "Signature Burger",
    description: "Brioche bun, aged cheddar, caramelized onion, and our citrus aioli.",
    image:
      "https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwYnVyZ2VyJTIwcmVzdGF1cmFudHxlbnwwfHx8fDE3Njg5NjUwNDh8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    title: "Garden Club",
    description: "Stacked layers of roasted veggies, pesto, and herbed yogurt spread.",
    image:
      "https://images.unsplash.com/photo-1757961048411-73703e333d25?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxjbHViJTIwc2FuZHdpY2glMjBwbGF0ZXxlbnwwfHx8fDE3Njg5NjUwNDl8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    title: "Velvet Latte",
    description: "Single-origin espresso with oat milk and handcrafted latte art.",
    image:
      "https://images.unsplash.com/photo-1630040995437-80b01c5dd52d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHxsYXR0ZSUyMGFydCUyMGNvZmZlZSUyMGN1cHxlbnwwfHx8fDE3Njg4Nzg0ODB8MA&ixlib=rb-4.1.0&q=85",
  },
];

const experiences = [
  {
    title: "Chef-led tastings",
    description: "Seasonal menus curated weekly with local farms and artisan suppliers.",
  },
  {
    title: "Private events",
    description: "Celebrate with intimate dining experiences and custom beverage pairings.",
  },
  {
    title: "Neighborhood brunch",
    description: "Weekend brunch with live acoustic sets and fresh pastries every hour.",
  },
];

const App = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight text-white">Café Delune</span>
            <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
              New Menu
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-200 md:flex">
            <a className="transition hover:text-white" href="#experience">
              Experience
            </a>
            <a className="transition hover:text-white" href="#menu">
              Menu
            </a>
            <a className="transition hover:text-white" href="#events">
              Events
            </a>
            <a className="transition hover:text-white" href="#contact">
              Contact
            </a>
          </nav>
          <button
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
            data-testid="cta-reserve-table"
          >
            Reserve a table
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-16 pt-20">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          </div>
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                Modern bistro · Istanbul
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">
                A crafted dining experience built for lingering nights and bright mornings.
              </h1>
              <p className="mt-5 text-lg text-slate-200">
                Café Delune blends seasonal plates with an ambient lounge, delivering a fully curated
                website presence for reservations, private dining, and culinary storytelling.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  data-testid="cta-view-menu"
                >
                  View menu
                </button>
                <button
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                  data-testid="cta-plan-event"
                >
                  Plan an event
                </button>
              </div>
              <div className="mt-10 grid gap-6 text-sm text-slate-200 sm:grid-cols-3">
                {[
                  { label: "Open daily", value: "08:00 - 01:00" },
                  { label: "Kitchen", value: "Mediterranean" },
                  { label: "Seating", value: "120 indoors" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-200">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-4 top-6 h-16 w-32 rounded-full bg-white/10 blur-xl" />
              <img
                src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=900&q=80"
                alt="Stylish restaurant lounge"
                className="h-full min-h-[420px] w-full rounded-[2.5rem] object-cover shadow-2xl"
              />
              <div className="absolute -bottom-6 left-6 rounded-3xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Next tasting</p>
                <p className="mt-2 text-lg font-semibold text-white">Friday, 20:00 · Chef’s Table</p>
                <p className="mt-1 text-sm text-slate-300">Reserve by phone or online.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="bg-slate-900/40 py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                  Signature experience
                </p>
                <h2 className="mt-4 text-3xl font-bold text-white">Why guests return</h2>
              </div>
              <p className="max-w-xl text-base text-slate-300">
                A refined website presence should highlight your story, showcase key offerings, and
                make it effortless for guests to connect. We focus on the moments that matter.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {experiences.map((experience) => (
                <div
                  key={experience.title}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-6"
                >
                  <h3 className="text-xl font-semibold text-white">{experience.title}</h3>
                  <p className="mt-3 text-sm text-slate-300">{experience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="menu" className="py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                  Highlights
                </p>
                <h2 className="mt-4 text-3xl font-bold text-white">Menu crafted for the website</h2>
              </div>
              <button
                className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white"
                data-testid="cta-download-menu"
              >
                Download full menu
              </button>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {menuHighlights.map((item) => (
                <article
                  key={item.title}
                  className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5"
                >
                  <img src={item.image} alt={item.title} className="h-52 w-full object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm text-slate-300">{item.description}</p>
                    <button
                      className="mt-6 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
                      data-testid={`cta-order-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      View details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="events" className="bg-slate-900/50 py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">
                Events & private dining
              </p>
              <h2 className="mt-4 text-3xl font-bold text-white">Host experiences worth sharing.</h2>
              <p className="mt-4 text-base text-slate-300">
                We curate chef-led events, private celebrations, and brand activations. Your website
                should spotlight these moments and make booking effortless.
              </p>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  14-person private chef lounge with bespoke menus.
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Event concierge for lighting, sound, and floral styling.
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Tailored digital invites and RSVP management.
                </div>
              </div>
            </div>
            <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-orange-500/10 p-8">
              <div className="grid gap-6">
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Upcoming</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Midnight Jazz Brunch</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Saturday · 22:00 · Limited seating for 45 guests.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-200">Private dining</p>
                  <h3 className="mt-3 text-xl font-semibold text-white">Corporate Tasting Menu</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Custom pairings, dedicated service, and branded menus.
                  </p>
                </div>
                <button
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900"
                  data-testid="cta-book-event"
                >
                  Book an event
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="py-16">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Visit us</h3>
              <p className="mt-4 text-sm text-slate-300">
                Abdi İpekçi Cd. No:48, Nişantaşı · İstanbul
              </p>
              <p className="mt-2 text-sm text-slate-300">+90 (212) 555 0123</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Hours</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Mon - Thu · 08:00 - 00:00</p>
                <p>Fri · 08:00 - 02:00</p>
                <p>Sat - Sun · 09:00 - 02:00</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Stay in touch</h3>
              <p className="mt-4 text-sm text-slate-300">
                Join our newsletter for tasting menus and events.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  className="flex-1 rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-400"
                  placeholder="Email address"
                  data-testid="input-email"
                />
                <button
                  className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white"
                  data-testid="cta-subscribe"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-400">
        © 2024 Café Delune. Designed for immersive web experiences.
      </footer>
    </div>
  );
};

export default App;
