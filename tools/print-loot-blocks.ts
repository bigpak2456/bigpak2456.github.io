import * as path from "path";
import { loadBlocks } from "./lib/blocks-xml";
import { Loot, LootTable } from "./lib/loot";
import { handleMain, vanillaDir } from "./lib/utils";

const CMD = `npx ts-node ${path.basename(process.argv[1])}`;
const USAGE = `Usage: ${CMD} <item name regexp>

Search acid can:
    ${CMD} resourceAcid

Search shotguns: 
    ${CMD} '(?!.*Schematic$)^gunShotgun'`;

async function main() {
  if (process.argv.length !== 3) {
    console.error(USAGE);
    return 1;
  }

  const configDir = await vanillaDir("Data", "Config");
  const pattern = new RegExp(process.argv[2]);
  const lootXml = new Loot(path.join(configDir, "loot.xml"));
  const lootContainers = await lootXml.findLootContainer(pattern);
  const items = flattenItems(lootContainers);

  console.log("Container Names");
  console.log(lootContainers.map((c) => c.name).join(", "));

  console.log();
  console.log("Items");
  for (const i of items) console.log(i);

  const blocks = await loadBlocks(path.join(configDir, "blocks.xml"));
  const matchedBlocks = blocks.findByLootIds(new Set(lootContainers.map((c) => c.name)));
  console.log();
  console.log("Container Blocks");
  for (const b of matchedBlocks) console.log(b.name);

  const downgradeGraph = matchedBlocks.flatMap((b) => blocks.findByDowngradeBlocks([b]));
  console.log();
  console.log("Downgrade");
  for (const g of downgradeGraph) if (g.length > 1) console.log(g.map((b) => b.name).join(" -> "));

  return 0;
}

function flattenItems(lootContainers: LootTable[]): Set<string> {
  return new Set(lootContainers.flatMap((c) => c.items.concat(Array.from(flattenItems(c.groups)))));
}

handleMain(main());
