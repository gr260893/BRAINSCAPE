export const metadata = {
  title: 'CBR Quiz - Simulado Radiologia',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>{children}</body>
    </html>
  );
}
