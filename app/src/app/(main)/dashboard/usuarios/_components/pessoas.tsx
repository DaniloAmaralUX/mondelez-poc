"use client";

import { useMemo, useState } from "react";

import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { localRepository } from "@/data/repository";
import { escalaDoDia } from "@/domain/escala";
import { NOME_DO_PERFIL, pode } from "@/domain/permissoes";
import { dataLocal } from "@/domain/producao";
import { turnoAtual } from "@/domain/turno";
import type { Perfil, Turma, Usuario } from "@/domain/types";
import { getInitials } from "@/lib/utils";
import { useAgora, useSessionStore, useUsuarioAtual } from "@/stores/session/session-store";

const TODOS = "todos";
const SEM = "sem";
const PERFIS: Perfil[] = ["operacao", "supervisao", "gerencia", "especialista", "assistencia"];

function nomeDoPosto(postoId: string | undefined) {
  if (!postoId) return "—";
  const posto = localRepository.posto(postoId);
  const linha = posto ? localRepository.linha(posto.linhaId) : undefined;
  return posto ? `${linha?.nome ?? ""} · ${posto.nome}` : postoId;
}

/**
 * Pessoas (RF-12, v0.5): quem trabalha na seção, com perfil, posto, turma e a escala de hoje. A Assistência (e a
 * Gerência) cadastra uma pessoa nova ligada ao posto, sem chamar a TI (job P2 do assistente). Template: Users.
 */
export function Pessoas() {
  const usuario = useUsuarioAtual();
  const agora = useAgora();
  const ajustes = useSessionStore((s) => s.ajustesEscala);
  const cadastrados = useSessionStore((s) => s.usuariosCadastrados);
  const [perfil, setPerfil] = useState<string>(TODOS);
  const [busca, setBusca] = useState("");
  const [cadastrando, setCadastrando] = useState(false);
  const podeCadastrar = pode(usuario?.perfil, "usuarios", "administrar");
  const turno = turnoAtual(agora);
  const hoje = dataLocal(turno.data);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `cadastrados` muda o que o repositório devolve
  const pessoas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return localRepository
      .usuarios()
      .filter((p) => perfil === TODOS || p.perfil === perfil)
      .filter((p) => !termo || `${p.nome} ${p.matricula} ${p.cargo}`.toLowerCase().includes(termo))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [perfil, busca, cadastrados]);

  const escalaDe = (p: Usuario) => {
    const dia = escalaDoDia(p, hoje, ajustes);
    if (!dia) return "Administrativo";
    return dia.dia === "folga" ? "Folga hoje" : `${dia.dia}º turno hoje`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[2rem] leading-[1.1]">Pessoas</h1>
          <p className="text-lg text-muted-foreground">
            {pessoas.length} {pessoas.length === 1 ? "pessoa" : "pessoas"} na seção · Chocolate
          </p>
        </div>
        {podeCadastrar && (
          <Button className="h-11 toque:h-14" onClick={() => setCadastrando(true)}>
            <UserPlus data-icon="inline-start" />
            Cadastrar pessoa
          </Button>
        )}
      </header>

      <div className="flex @3xl/content:flex-row flex-col gap-3">
        <InputGroup className="toque:h-14 @3xl/content:max-w-sm bg-card">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Buscar pessoa"
            placeholder="Nome, matrícula ou cargo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </InputGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={perfil}
          onValueChange={(v) => v && setPerfil(v)}
          aria-label="Perfil"
          className="flex-wrap"
        >
          <ToggleGroupItem value={TODOS} className="h-10 px-3">
            Todos
          </ToggleGroupItem>
          {PERFIS.map((p) => (
            <ToggleGroupItem key={p} value={p} className="h-10 px-3">
              {NOME_DO_PERFIL[p]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Card className="gap-0 py-0">
        <div className="@3xl/content:block hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Pessoa</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Posto</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead className="pr-4">Escala</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pessoas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback>{getInitials(p.nome)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {p.nome}
                          {cadastrados[p.id] && (
                            <Badge variant="secondary" className="font-normal">
                              Novo
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm tabular-nums">
                          {p.cargo} · matrícula {p.matricula}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{NOME_DO_PERFIL[p.perfil]}</TableCell>
                  <TableCell>{nomeDoPosto(p.postoId)}</TableCell>
                  <TableCell>{p.turma ?? "—"}</TableCell>
                  <TableCell className="pr-4 text-muted-foreground">{escalaDe(p)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ul className="@3xl/content:hidden divide-y">
          {pessoas.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-4">
              <Avatar className="size-11">
                <AvatarFallback>{getInitials(p.nome)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-medium text-base">
                  {p.nome}
                  {cadastrados[p.id] && <Badge variant="secondary">Novo</Badge>}
                </div>
                <div className="text-muted-foreground text-sm">
                  {NOME_DO_PERFIL[p.perfil]} · {p.cargo}
                </div>
                <div className="text-muted-foreground text-sm tabular-nums">
                  {nomeDoPosto(p.postoId)} · turma {p.turma ?? "—"} · {escalaDe(p)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {podeCadastrar && <CadastroDePessoa key={usuario?.id} aberto={cadastrando} onAbertoChange={setCadastrando} />}
    </div>
  );
}

function CadastroDePessoa({ aberto, onAbertoChange }: { aberto: boolean; onAbertoChange: (aberto: boolean) => void }) {
  const cadastrarUsuario = useSessionStore((s) => s.cadastrarUsuario);
  const contexto = useSessionStore((s) => s.contexto);
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("operacao");
  const [cargo, setCargo] = useState("Operador de Embalagem");
  const [postoId, setPostoId] = useState<string>(contexto?.postoId ?? SEM);
  const [turma, setTurma] = useState<string>("A");
  const [erro, setErro] = useState<{ campo: "nome" | "matricula"; texto: string } | null>(null);
  const postos = contexto ? localRepository.postos(contexto.linhaId) : [];

  function limpar() {
    setNome("");
    setMatricula("");
    setErro(null);
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = cadastrarUsuario({
      nome,
      matricula,
      perfil,
      cargo,
      postoId: postoId === SEM ? undefined : postoId,
      turma: turma === SEM ? undefined : (turma as Turma),
    });
    if (!resultado.ok) {
      setErro({ campo: resultado.campo, texto: resultado.erro });
      return;
    }
    toast.success(`${resultado.usuario.nome} cadastrada`, {
      description: `Matrícula ${resultado.usuario.matricula}. PIN inicial 1234: troque no primeiro acesso.`,
    });
    limpar();
    onAbertoChange(false);
  }

  return (
    <Sheet open={aberto} onOpenChange={onAbertoChange}>
      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={salvar} className="flex h-full flex-col" noValidate>
          <SheetHeader>
            <SheetTitle>Cadastrar pessoa</SheetTitle>
            <SheetDescription>A pessoa já entra no tablet com a matrícula e o PIN inicial.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="flex-1 gap-4 overflow-y-auto px-4">
            <Field data-invalid={erro?.campo === "nome" || undefined}>
              <FieldLabel htmlFor="pessoa-nome">Nome completo</FieldLabel>
              <Input
                id="pessoa-nome"
                className="h-11"
                autoComplete="off"
                value={nome}
                aria-invalid={erro?.campo === "nome" || undefined}
                onChange={(e) => setNome(e.target.value)}
              />
              {erro?.campo === "nome" && <FieldError>{erro.texto}</FieldError>}
            </Field>
            <Field data-invalid={erro?.campo === "matricula" || undefined}>
              <FieldLabel htmlFor="pessoa-matricula">Matrícula</FieldLabel>
              <Input
                id="pessoa-matricula"
                className="h-11 tabular-nums"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                placeholder="6 números do crachá"
                value={matricula}
                aria-invalid={erro?.campo === "matricula" || undefined}
                onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              />
              {erro?.campo === "matricula" && <FieldError>{erro.texto}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Perfil</FieldLabel>
              <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)}>
                <SelectTrigger className="h-11 w-full" aria-label="Perfil">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PERFIS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {NOME_DO_PERFIL[p]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="pessoa-cargo">Cargo</FieldLabel>
              <Input id="pessoa-cargo" className="h-11" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Posto</FieldLabel>
              <Select value={postoId} onValueChange={setPostoId}>
                <SelectTrigger className="h-11 w-full" aria-label="Posto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={SEM}>Sem posto fixo</SelectItem>
                    {postos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {nomeDoPosto(p.id)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Turma da escala</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={2}
                value={turma}
                onValueChange={(v) => v && setTurma(v)}
                aria-label="Turma"
                className="w-full"
              >
                {["A", "B", "C", "D", SEM].map((t) => (
                  <ToggleGroupItem key={t} value={t} className="h-11 flex-1">
                    {t === SEM ? "Nenhuma" : t}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button type="submit" className="h-11 toque:h-16 w-full toque:text-base">
              Cadastrar
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
