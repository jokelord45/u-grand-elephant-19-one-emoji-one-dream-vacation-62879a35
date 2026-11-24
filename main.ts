/**
 * One Emoji, One Dream Vacation — make.fun bounty entry.
 *
 * Task: send EXACTLY ONE emoji for your dream vacation, nothing else.
 * A judge model reads entries two at a time and picks the one that most
 * makes a stranger want to book the flight. One winner takes the whole
 * reward, so the pick has to survive pairwise judging, not just look nice.
 *
 * This program does not hard-code the answer. It generates a slate of
 * candidate emojis, scores each one against the judge's own published
 * criteria (in the judge's own order of importance), ranks them with a
 * deterministic tie-break, validates the winner against the entry gate
 * (UTF-8, 1-8 characters, exactly one emoji, no whitespace), and writes
 * exactly that one emoji — and nothing else — to /output/entry.txt.
 *
 * Node 22, stdlib only, no dependencies.
 * Run: node main.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";

const OUTPUT_PATH = "/output/entry.txt";

/**
 * The judge's criteria, most important first, exactly as published in
 * the kit's RULES.txt:
 *   1. Is exactly one emoji, no words, and it lands on a dream vacation:
 *      a beach, a mountain, a plane, a hammock, a faraway place.
 *   2. Evokes the trip vividly at a glance, like a postcard.
 *   3. Feels personal and specific rather than generic.
 *   4. Carries a spark of wit or surprise.
 *   5. Reads instantly across cultures and screens, clear at small size.
 * Weights follow that order: criterion 1 matters most, criterion 5 least.
 */
const CRITERION_WEIGHTS = [5, 4, 3, 2, 1] as const;

interface Candidate {
  /** The emoji itself, exactly as it would be submitted. */
  emoji: string;
  /** Short human-readable name, for the ranking log only. */
  name: string;
  /** What scene/feeling this emoji paints, in one line. */
  scene: string;
  /**
   * Scores 0-5 on the five judge criteria above, in order.
   * Scored by hand against the brief, before any ranking runs:
   * a generic beach scores high on "is a vacation" but low on
   * "specific" and "surprise"; an activity scores high on "specific"
   * but lower on "plainly names a vacation".
   */
  scores: [number, number, number, number, number];
}

/**
 * Candidate slate. Deliberately broad: the obvious vacation glyphs, the
 * scenic moments, the specific activities, and the ones that only look
 * like a vacation at second glance (those score low on criterion 1 and
 * get filtered out by the ranking, which is the point — the generator
 * must be able to reject a pretty-but-wrong pick).
 */
const CANDIDATES: Candidate[] = [
  {
    emoji: "\u{1F3DD}\u{FE0F}",
    name: "desert island",
    scene: "One palm tree on a tiny island in an endless blue sea — escape, solitude, paradise.",
    scores: [5, 5, 4, 3, 5],
  },
  {
    emoji: "\u{1F305}",
    name: "sunrise over the sea",
    scene: "Dawn breaking over the water — the first morning of the trip, a new day somewhere far away.",
    scores: [4, 5, 3, 3, 5],
  },
  {
    emoji: "\u{1F6F6}",
    name: "canoe",
    scene: "A quiet paddle across still water at dawn — a lake cabin, a fjord, nowhere to be.",
    scores: [4, 4, 5, 4, 4],
  },
  {
    emoji: "\u{1F3C4}",
    name: "surfer",
    scene: "Catching a wave at golden hour — one particular surf trip, not any holiday.",
    scores: [4, 4, 5, 4, 4],
  },
  {
    emoji: "\u{1F3D6}\u{FE0F}",
    name: "beach with umbrella",
    scene: "The postcard beach — umbrella, sand, sun. Everybody's vacation, nobody's in particular.",
    scores: [5, 4, 2, 1, 5],
  },
  {
    emoji: "\u{1F334}",
    name: "palm tree",
    scene: "A single palm against the sky — tropical, warm, but a tree, not a trip.",
    scores: [4, 4, 3, 2, 5],
  },
  {
    emoji: "\u{2708}\u{FE0F}",
    name: "airplane",
    scene: "Wheels up — the journey, not the destination. Every trip starts here, none ends here.",
    scores: [4, 3, 2, 2, 5],
  },
  {
    emoji: "\u{1F3D4}\u{FE0F}",
    name: "snow-capped mountain",
    scene: "A high alpine peak — the mountain dream, cold air and a long way from the office.",
    scores: [4, 4, 4, 3, 4],
  },
  {
    emoji: "\u{1F379}",
    name: "tropical drink",
    scene: "A cocktail with a little umbrella — the resort bar at sunset, relaxation in a glass.",
    scores: [3, 3, 3, 3, 5],
  },
  {
    emoji: "\u{1F9F3}",
    name: "luggage",
    scene: "A packed suitcase — the trip is coming, but this is the packing, not the place.",
    scores: [3, 3, 2, 2, 4],
  },
  {
    emoji: "\u{1F6A3}",
    name: "person rowing boat",
    scene: "Rowing out onto the lake — active, peaceful, but the glyph is small and busy.",
    scores: [4, 3, 4, 3, 3],
  },
  {
    emoji: "\u{1F30A}",
    name: "water wave",
    scene: "A curling wave — the sea itself, vivid but placeless; any coast, no dream attached.",
    scores: [3, 4, 2, 2, 4],
  },
];

/** Weighted total of a candidate's five criterion scores. */
function weightedScore(c: Candidate): number {
  return c.scores.reduce((sum, s, i) => sum + s * CRITERION_WEIGHTS[i], 0);
}

/**
 * Rank the candidates the way the judge decides: weighted score first.
 * Ties break the way the brief breaks them — the first criterion where
 * two entries differ decides — so compare criterion by criterion, then
 * prefer the smaller UTF-8 byte size (the leaderboard's own tie-break),
 * then the earlier candidate in the slate.
 */
function rankCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => {
    const diff = weightedScore(b) - weightedScore(a);
    if (diff !== 0) return diff;
    for (let i = 0; i < a.scores.length; i++) {
      if (a.scores[i] !== b.scores[i]) return b.scores[i] - a.scores[i];
    }
    const bytes =
      Buffer.byteLength(a.emoji, "utf8") - Buffer.byteLength(b.emoji, "utf8");
    if (bytes !== 0) return bytes;
    return candidates.indexOf(a) - candidates.indexOf(b);
  });
}

/**
 * Head-to-head check, mirroring the judge's own procedure: walk the
 * criteria in order and name the first one where the winner beats the
 * runner-up. If the winner only wins on total weight but loses the
 * first differing criterion, the ranking is lying about how the judge
 * decides — that must show up here, not in the final.
 */
function decidingCriterion(winner: Candidate, runnerUp: Candidate): string {
  const names = [
    "names a dream vacation",
    "vivid postcard at a glance",
    "personal and specific",
    "wit or surprise",
    "reads instantly",
  ];
  for (let i = 0; i < winner.scores.length; i++) {
    if (winner.scores[i] !== runnerUp.scores[i]) {
      return winner.scores[i] > runnerUp.scores[i]
        ? `criterion ${i + 1} (${names[i]}): ${winner.scores[i]} vs ${runnerUp.scores[i]}`
        : `WARNING: loses first differing criterion ${i + 1} (${names[i]}): ${winner.scores[i]} vs ${runnerUp.scores[i]}`;
    }
  }
  return "identical scores — tie-break by byte size, then slate order";
}

/**
 * Validate an entry against the sealed gate, as published:
 * UTF-8 text of 1 to 8 characters, not only white space, exactly one
 * emoji. A grapheme-cluster count (Intl.Segmenter) is the honest check
 * for "one emoji": the desert island is two code points (U+1F3DD plus
 * VS16) but a single grapheme, a single glyph on screen.
 */
function validateEntry(emoji: string): string | null {
  if (!emoji || emoji.trim() !== emoji || /\s/.test(emoji)) {
    return "entry must be a single emoji with no whitespace";
  }
  const graphemes = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(emoji)];
  if (graphemes.length !== 1) {
    return `entry must be exactly one emoji, found ${graphemes.length} grapheme clusters`;
  }
  const codePoints = [...emoji].length;
  if (codePoints < 1 || codePoints > 8) {
    return `entry must be 1-8 characters, found ${codePoints}`;
  }
  if (Buffer.byteLength(emoji, "utf8") > 8) {
    return "entry must fit the gate's byte budget";
  }
  // Exactly one emoji: one grapheme, and it must be an emoji presentation.
  if (!/\p{Extended_Pictographic}/u.test(emoji)) {
    return "entry must be an emoji";
  }
  return null;
}

function main(): void {
  const ranked = rankCandidates(CANDIDATES);

  console.log("Candidate ranking (weighted score, max 75):");
  for (const c of ranked) {
    console.log(
      `  ${c.emoji}  ${c.name.padEnd(24)} ${String(weightedScore(c)).padStart(2)}  [${c.scores.join(", ")}]`,
    );
  }

  const winner = ranked[0];
  const runnerUp = ranked[1];
  console.log(`\nWinner: ${winner.emoji} (${winner.name}) — ${winner.scene}`);
  console.log(
    `Head-to-head vs runner-up ${runnerUp.emoji} (${runnerUp.name}): ${decidingCriterion(winner, runnerUp)}`,
  );

  const problem = validateEntry(winner.emoji);
  if (problem) {
    throw new Error(`winner failed the entry gate: ${problem}`);
  }

  // Exactly the one emoji, nothing else: no trailing newline, no spaces.
  mkdirSync("/output", { recursive: true });
  writeFileSync(OUTPUT_PATH, winner.emoji, "utf8");
  console.log(`Wrote ${OUTPUT_PATH} (${Buffer.byteLength(winner.emoji, "utf8")} bytes UTF-8)`);
}

main();
