import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/karaoke";

async function testMusics() {
  try {
    console.log("Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB com sucesso!\n");

    // Buscar na coleção "musics"
    const MusicCollection = mongoose.connection.collection("musics");

    // Contar total de documentos
    const total = await MusicCollection.countDocuments({});
    console.log(`📊 Total de músicas no banco: ${total}\n`);

    if (total === 0) {
      console.log("⚠️  Nenhuma música encontrada no banco de dados.");
      console.log("   Verifique se os dados foram importados corretamente.\n");
    } else {
      // Buscar as primeiras 5 músicas
      console.log("🎵 Buscando as primeiras 5 músicas:\n");
      const musics = await MusicCollection.find({})
        .limit(5)
        .toArray();

      musics.forEach((music, index) => {
        console.log(`${index + 1}. ID: ${music.id || music._id}`);
        console.log(`   Artista: ${music.artista || "N/A"}`);
        console.log(`   Música: ${music.musica || "N/A"}`);
        console.log(`   Arquivo: ${music.arquivo || "N/A"}`);
        console.log(`   Início: ${music.inicio || "N/A"}`);
        console.log("");
      });

      // Testar busca com filtro
      if (musics.length > 0 && musics[0].artista) {
        const artistaTest = musics[0].artista;
        console.log(`🔍 Testando busca por artista: "${artistaTest}"\n`);
        const filteredMusics = await MusicCollection.find({
          artista: { $regex: artistaTest, $options: "i" }
        }).limit(3).toArray();
        
        console.log(`   Encontradas ${filteredMusics.length} música(s) com esse artista:\n`);
        filteredMusics.forEach((music, index) => {
          console.log(`   ${index + 1}. ${music.artista} - ${music.musica}`);
        });
      }
    }

    // Fechar conexão
    await mongoose.connection.close();
    console.log("\n✅ Teste concluído! Conexão fechada.");
  } catch (error) {
    console.error("❌ Erro durante o teste:", error);
    process.exit(1);
  }
}

testMusics();

