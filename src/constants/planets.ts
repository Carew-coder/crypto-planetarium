import { Planet } from '@/types/universe';
import { generateRandomPosition, generateRandomColor } from '@/utils/positionUtils';

export const CRYPTO_NAMES = [
  "Bitcoin", "Ethereum", "Solana", "Cardano", "Polkadot"
];

export const PLANET_TEXTURES = [
  '/lovable-uploads/98244a61-a143-42a1-bc04-7400b789f28f.png',
  '/lovable-uploads/07940f47-fc24-4197-ba10-be4390f882b2.png',
  '/lovable-uploads/f115cbf1-f4ec-4c06-9d95-2a208ce87fa6.png',
  '/lovable-uploads/0a36d67b-b2b3-4558-aad4-6665abaca922.png',
  '/lovable-uploads/b6686ee5-c2dd-4297-8768-e92bc549f292.png',
];

export const SUN_TEXTURE = '/lovable-uploads/c2d72184-32ac-4494-afd9-68ded2b76024.png';

export const SAMPLE_PLANETS: Planet[] = [
  {
    id: "btc",
    name: "Bitcoin",
    value: 45000,
    color: "#F7931A",
    size: 2,
    position: [-15, 5, -10],
  },
  {
    id: "eth",
    name: "Ethereum",
    value: 2500,
    color: "#627EEA",
    size: 1.5,
    position: [20, -8, 15],
  },
  {
    id: "sol",
    name: "Solana",
    value: 100,
    color: "#00FFA3",
    size: 1,
    position: [12, 15, -18],
  },
  {
    id: "ada",
    name: "Cardano",
    value: 1.20,
    color: "#0033AD",
    size: 1.2,
    position: [-8, -12, 10],
  },
  {
    id: "dot",
    name: "Polkadot",
    value: 15.50,
    color: "#E6007A",
    size: 1.1,
    position: [5, 18, -5],
  }
];