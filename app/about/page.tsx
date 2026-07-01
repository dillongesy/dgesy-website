import About from "../components/About";
import Skills from "../components/Skills";

export const metadata = {
  title: "About - Dillon Gesy",
};

export default function AboutPage() {
  return (
    <main className="pt-24 flex-1">
      <About />
      <Skills />
    </main>
  );
}
