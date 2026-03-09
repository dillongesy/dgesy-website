import CursorGlow from "./components/CursorGlow";
import ScrollProgress from "./components/ScrollProgress";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import SpotifyWidget from "./components/SpotifyWidget";
import { personal } from "./data/portfolio";

export default function Home() {
  return (
    <>
      {/* Chrome */}
      <CursorGlow />
      <ScrollProgress />
      <Nav />

      {/* Sections */}
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Contact />
      </main>

      {/* Spotify now playing — only renders when configured + a song is playing */}
      <SpotifyWidget />

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/[0.04] text-center">
        <p className="text-sm text-slate-600 font-mono">
          Designed &amp; built by{" "}
          <span className="text-indigo-400">{personal.name}</span>
          {" · "}
          <span className="text-slate-700">{new Date().getFullYear()}</span>
        </p>
      </footer>
    </>
  );
}
