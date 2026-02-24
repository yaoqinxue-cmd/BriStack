export const metadata = { title: "Subscribe" };

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { margin: 0 !important; padding: 0 !important; background: transparent !important; }
      `}</style>
      {children}
    </>
  );
}
