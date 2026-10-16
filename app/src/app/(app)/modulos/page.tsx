import { GradeModulos } from "./_components/grade-modulos";

export default function ModulosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-strong text-2xl">Módulos</h1>
        <p className="text-muted-foreground">
          Todos os registros e consultas do posto. O dia a dia começa em Minha Rotina.
        </p>
      </div>
      <GradeModulos />
    </div>
  );
}
