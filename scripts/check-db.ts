
import { db } from "../server/db";
import { annonces } from "../server/schema";

async function main() {
  try {
    const allAnnonces = await db.select().from(annonces);
    console.log(`Nombre total d'annonces: ${allAnnonces.length}`);
    
    if (allAnnonces.length > 0) {
      console.log("Détails des premières annonces:");
      allAnnonces.slice(0, 5).forEach(a => {
        console.log(`- ID: ${a.id}, Titre: ${a.titre}, Type: ${a.type}, Status: ${a.status}, Boosted: ${a.boosted}, Ownership: ${a.ownership}, Vendeur: ${a.vendeurType}`);
      });
    }
  } catch (error) {
    console.error("Erreur lors de la lecture de la base de données:", error);
  }
  process.exit(0);
}

main();
