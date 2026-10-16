import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function Page() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">Em construção.</h1>
      <p className="text-muted-foreground">Esta tela entra em uma próxima versão do protótipo.</p>
    </div>
  );
}
