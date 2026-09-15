/**
 * Theme layer types for OhMyLife.
 *
 * A theme supplies colour tokens, typography stacks, and image slots
 * (hero rotations and area card photography).
 * Layout, type scale, and spacing stay the product's.
 */

export type ThemeModeCommitment = "both" | "light-only" | "dark-only";

export interface ThemeColorPalette {
  bg: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  ink: string;
  inkMuted: string;
  forest: string;
  forestStrong: string;
  forestInk: string;
  forestInkMuted: string;
  terracotta: string;
  sage: string;
  dustyRose: string;
  plum: string;
  plumInk: string;
  accentText: string;
  accentUi: string;
  scriptText: string;
  print?: string;
  rule?: string;
  ruleSoft?: string;
  tape?: string;
  plumInkMuted?: string;
  plumAccent?: string;
  plumGlow?: string;
  sceneWallTop?: string;
  sceneWallLow?: string;
  sceneFloor?: string;
  sceneWood?: string;
  sceneWoodDark?: string;
  sceneCork?: string;
  sceneLeaf?: string;
  sceneLeafDeep?: string;
  sceneFar?: string;
  sceneNear?: string;
  sceneSage?: string;
  sceneSageDeep?: string;
  sceneTerracotta?: string;
  sceneTerracottaDeep?: string;
  sceneRose?: string;
  scenePlum?: string;
  scenePlumDeep?: string;
  scenePaper?: string;
  scenePaperShade?: string;
  sceneBrass?: string;
  sceneBrassDeep?: string;
  sceneSun?: string;
  sceneShade?: string;
  sceneCup?: string;
  sceneTea?: string;
  scenePath?: string;
  sceneWater?: string;
  sceneInk?: string;
  sceneSkyTop?: string;
  sceneSkyLow?: string;
  sceneGlow?: string;
  sceneGlowStrength?: string | number;
  sceneBeamStrength?: string | number;
  sceneStarStrength?: string | number;
  sceneSteamStrength?: string | number;
  [key: string]: string | number | undefined;
}

export interface ThemeTypography {
  sans: string;
  serif?: string;
  script?: string;
  mono?: string;
}

export interface ImageSlotDefinition {
  src: string;
  alt: string;
  license: string;
}

export interface ThemeImages {
  hero?: ImageSlotDefinition[];
  areas?: Record<string, ImageSlotDefinition>;
}

export interface ThemeManifest {
  name: string;
  id: string;
  description?: string;
  mode?: ThemeModeCommitment;
  colors: {
    light?: ThemeColorPalette;
    dark?: ThemeColorPalette;
  };
  typography: ThemeTypography;
  images?: ThemeImages;
}

export interface UserImageOverrides {
  hero?: string[];
  areas?: Record<string, { src: string; alt?: string }>;
}
