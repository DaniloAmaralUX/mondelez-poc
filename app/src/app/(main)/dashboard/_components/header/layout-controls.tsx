"use client";

import { Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fontOptions } from "@/lib/fonts/registry";
import { PREFERENCE_REGISTRY } from "@/lib/preferences/preferences-config";
import { THEME_PRESET_OPTIONS } from "@/lib/preferences/theme";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function LayoutControls() {
  const { values, resolvedThemeMode, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      resolvedThemeMode: state.resolvedThemeMode,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );

  const {
    theme_mode: themeMode,
    theme_preset: themePreset,
    content_layout: contentLayout,
    navbar_style: navbarStyle,
    sidebar_variant: variant,
    sidebar_collapsible: collapsible,
    font,
  } = values;

  const onThemePresetChange = (value: string) => {
    const preset = PREFERENCE_REGISTRY.theme_preset.values.find((preset) => preset === value);
    if (!preset) return;
    setPreference("theme_preset", preset);
  };

  const onThemeModeChange = (value: string) => {
    const mode = PREFERENCE_REGISTRY.theme_mode.values.find((mode) => mode === value);
    if (!mode) return;
    setPreference("theme_mode", mode);
  };

  const onContentLayoutChange = (value: string) => {
    const layout = PREFERENCE_REGISTRY.content_layout.values.find((layout) => layout === value);
    if (!layout) return;
    setPreference("content_layout", layout);
  };

  const onNavbarStyleChange = (value: string) => {
    const style = PREFERENCE_REGISTRY.navbar_style.values.find((style) => style === value);
    if (!style) return;
    setPreference("navbar_style", style);
  };

  const onSidebarStyleChange = (value: string) => {
    const variant = PREFERENCE_REGISTRY.sidebar_variant.values.find((variant) => variant === value);
    if (!variant) return;
    setPreference("sidebar_variant", variant);
  };

  const onSidebarCollapseModeChange = (value: string) => {
    const collapsible = PREFERENCE_REGISTRY.sidebar_collapsible.values.find((collapsible) => collapsible === value);
    if (!collapsible) return;
    setPreference("sidebar_collapsible", collapsible);
  };

  const onFontChange = (value: string) => {
    const font = PREFERENCE_REGISTRY.font.values.find((font) => font === value);
    if (!font) return;
    setPreference("font", font);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Configurações de layout">
          <Settings />
        </Button>
      </PopoverTrigger>
      {/* Com os controles de 56 px do toque o painel cresce: rola em vez de sair da tela em paisagem. */}
      <PopoverContent align="end" className="max-h-(--radix-popover-content-available-height) overflow-y-auto">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="font-medium text-sm leading-none">Preferências</h4>
            <p className="text-muted-foreground text-xs">Ajuste o layout do painel neste tablet.</p>
          </div>
          <div className="space-y-3 **:data-[slot=toggle-group]:w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs">
            <div className="space-y-1">
              <Label className="font-medium text-xs">Tema</Label>
              <Select value={themePreset} onValueChange={onThemePresetChange}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {THEME_PRESET_OPTIONS.map((preset) => (
                      <SelectItem key={preset.value} className="text-xs" value={preset.value}>
                        <span
                          className="size-2.5 rounded-full"
                          style={{
                            backgroundColor: resolvedThemeMode === "dark" ? preset.primary.dark : preset.primary.light,
                          }}
                        />
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Fonte</Label>
              <Select value={font} onValueChange={onFontChange}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder="Escolha a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.key} className="text-xs" value={font.key}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Modo</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={themeMode}
                onValueChange={onThemeModeChange}
              >
                <ToggleGroupItem value="light" aria-label="Claro">
                  Claro
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Escuro">
                  Escuro
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="Sistema">
                  Sistema
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Largura da página</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={contentLayout}
                onValueChange={onContentLayoutChange}
              >
                <ToggleGroupItem value="centered" aria-label="Centralizada">
                  Centralizada
                </ToggleGroupItem>
                <ToggleGroupItem value="full-width" aria-label="Largura total">
                  Largura total
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Barra superior</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={navbarStyle}
                onValueChange={onNavbarStyleChange}
              >
                <ToggleGroupItem value="sticky" aria-label="Fixa">
                  Fixa
                </ToggleGroupItem>
                <ToggleGroupItem value="scroll" aria-label="Rola com a página">
                  Rola com a página
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Estilo da barra lateral</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={variant}
                onValueChange={onSidebarStyleChange}
              >
                <ToggleGroupItem value="inset" aria-label="Embutida">
                  Embutida
                </ToggleGroupItem>
                <ToggleGroupItem value="sidebar" aria-label="Padrão">
                  Padrão
                </ToggleGroupItem>
                <ToggleGroupItem value="floating" aria-label="Flutuante">
                  Flutuante
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="font-medium text-xs">Recolher barra lateral</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={collapsible}
                onValueChange={onSidebarCollapseModeChange}
              >
                <ToggleGroupItem value="icon" aria-label="Ícones">
                  Ícones
                </ToggleGroupItem>
                <ToggleGroupItem value="offcanvas" aria-label="Oculta">
                  Oculta
                </ToggleGroupItem>
              </ToggleGroup>
              {/* Com toque, "Ícones" vira "Oculta" (app-sidebar.tsx): os rótulos dos ícones dependem de tooltip.
                  pointer-coarse, e não toque:, porque a troca segue o ponteiro real, não o override data-density. */}
              <p className="pointer-coarse:block hidden text-muted-foreground text-xs">
                No tablet, recolhida, a barra lateral some por inteiro.
              </p>
            </div>

            <Button type="button" size="sm" variant="outline" className="w-full text-xs" onClick={resetPreferences}>
              Restaurar padrão
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
