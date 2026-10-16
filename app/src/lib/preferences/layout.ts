// Sidebar Variant
const SIDEBAR_VARIANT_OPTIONS = [
  { label: "Padrão", value: "sidebar" },
  { label: "Embutida", value: "inset" },
  { label: "Flutuante", value: "floating" },
] as const;
export const SIDEBAR_VARIANT_VALUES = SIDEBAR_VARIANT_OPTIONS.map((v) => v.value);
export type SidebarVariant = (typeof SIDEBAR_VARIANT_VALUES)[number];

// Sidebar Collapsible
const SIDEBAR_COLLAPSIBLE_OPTIONS = [
  { label: "Ícones", value: "icon" },
  { label: "Oculta", value: "offcanvas" },
] as const;
export const SIDEBAR_COLLAPSIBLE_VALUES = SIDEBAR_COLLAPSIBLE_OPTIONS.map((v) => v.value);
export type SidebarCollapsible = (typeof SIDEBAR_COLLAPSIBLE_VALUES)[number];

// Content Layout
const CONTENT_LAYOUT_OPTIONS = [
  { label: "Centralizada", value: "centered" },
  { label: "Total", value: "full-width" },
] as const;
export const CONTENT_LAYOUT_VALUES = CONTENT_LAYOUT_OPTIONS.map((v) => v.value);
export type ContentLayout = (typeof CONTENT_LAYOUT_VALUES)[number];

// Navbar Style
const NAVBAR_STYLE_OPTIONS = [
  { label: "Fixa", value: "sticky" },
  { label: "Rola", value: "scroll" },
] as const;
export const NAVBAR_STYLE_VALUES = NAVBAR_STYLE_OPTIONS.map((v) => v.value);
export type NavbarStyle = (typeof NAVBAR_STYLE_VALUES)[number];
