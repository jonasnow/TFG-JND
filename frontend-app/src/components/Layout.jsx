import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-play">
        {children}
      </main>
    </div>
  );
}
