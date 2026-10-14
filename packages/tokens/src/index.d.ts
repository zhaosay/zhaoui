export type Mode = 'light' | 'dark';
export type Audience = 'b' | 'c';
export type Density = 'compact' | 'standard' | 'comfortable';
export type Trend = 'cn' | 'intl';
export type Tokens = Record<string, string>;

export interface Tier { name: string; min?: number; max?: number; cols: number; gutter: string; pad: string; containerMax?: string }
export interface BrandMode { primary: string; hover: string; active: string; subtle: string; text: string; on: string }
export interface Brand { seed: string; scale: string[]; light: BrandMode; dark: BrandMode; darkSubtleHex: string }

export const brands: Record<string, string>;
export const base: Tokens;
export const modes: Record<Mode, Tokens>;
export const audiences: Record<Audience, Tokens>;
export const densities: Record<Density, Tokens>;
export const trends: Record<Trend, Tokens>;
export const styles: Record<'flat' | 'glass', Tokens>;
export function analyzeLogo(rgba: ArrayLike<number>, width: number, height: number): any;
export function analyzeLogoImage(source: Blob | HTMLImageElement | string, size?: number): Promise<any>;
export const DEFAULT_SEED: string;
export const layout: { tiers: Tier[]; wall: { scale: number; gutter: string; pad: string; touchMin: string }; touchMin: string; electronMinWindow: { width: number; height: number } };

export function hexToRgb(hex: string): [number, number, number];
export function contrast(a: string, b: string): number;
export function luminance(hex: string): number;
export function alpha(hex: string, a: number): string;
export function blend(fg: string, a: number, bg: string): string;

export function buildScale(hex: string): string[];
export function generateBrand(hex: string): Brand;
export function brandVars(hex: string): Record<string, string>;
export function brandCss(name: string, hex: string): string;
export function applyBrand(el: HTMLElement, hex: string): void;

export function buildCss(): string;
export function statusTints(mode: Mode): Tokens;
export function brandMapping(mode: Mode): Tokens;
