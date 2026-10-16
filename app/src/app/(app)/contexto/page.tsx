import { SeletorContexto } from "./_components/seletor-contexto";

export default function ContextoPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-strong text-2xl">Onde você está trabalhando?</h1>
        <p className="text-muted-foreground">O tablet lembra este posto. Só troque se mudar de lugar.</p>
      </div>
      <SeletorContexto />
    </div>
  );
}
