import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/karaoke";

// Dados de exemplo para teste
const sampleMusics = [
  {
    id: "001",
    arquivo: "musica001.mp3",
    artista: "Legião Urbana",
    musica: "Tempo Perdido",
    inicio: "00:00"
  },
  {
    id: "002",
    arquivo: "musica002.mp3",
    artista: "Legião Urbana",
    musica: "Que País É Este",
    inicio: "00:00"
  },
  {
    id: "003",
    arquivo: "musica003.mp3",
    artista: "Capital Inicial",
    musica: "Primeiros Erros",
    inicio: "00:00"
  },
  {
    id: "004",
    arquivo: "musica004.mp3",
    artista: "Capital Inicial",
    musica: "Natasha",
    inicio: "00:00"
  },
  {
    id: "005",
    arquivo: "musica005.mp3",
    artista: "Engenheiros do Hawaii",
    musica: "Terra de Gigantes",
    inicio: "00:00"
  },
  {
    id: "006",
    arquivo: "musica006.mp3",
    artista: "Engenheiros do Hawaii",
    musica: "Infinita Highway",
    inicio: "00:00"
  },
  {
    id: "007",
    arquivo: "musica007.mp3",
    artista: "Paralamas do Sucesso",
    musica: "Vital e Sua Moto",
    inicio: "00:00"
  },
  {
    id: "008",
    arquivo: "musica008.mp3",
    artista: "Paralamas do Sucesso",
    musica: "Alagados",
    inicio: "00:00"
  },
  {
    id: "009",
    arquivo: "musica009.mp3",
    artista: "Titãs",
    musica: "Epitáfio",
    inicio: "00:00"
  },
  {
    id: "010",
    arquivo: "musica010.mp3",
    artista: "Titãs",
    musica: "Comida",
    inicio: "00:00"
  }
];

async function seedMusics() {
  try {
    console.log("Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB com sucesso!\n");

    const MusicCollection = mongoose.connection.collection("musics");

    // Verificar se já existem dados
    const existingCount = await MusicCollection.countDocuments({});
    
    if (existingCount > 0) {
      console.log(`⚠️  Já existem ${existingCount} músicas no banco.`);
      console.log("   Deseja continuar e adicionar mais? (S/N)");
      console.log("   Para limpar e recriar, delete a coleção manualmente.\n");
      
      // Por padrão, vamos apenas adicionar (não sobrescrever)
      console.log("   Adicionando dados de exemplo...\n");
    } else {
      console.log("📝 Inserindo dados de exemplo...\n");
    }

    // Inserir dados
    const result = await MusicCollection.insertMany(sampleMusics, { ordered: false });
    
    console.log(`✅ ${result.insertedCount} música(s) inserida(s) com sucesso!\n`);
    
    // Verificar total
    const total = await MusicCollection.countDocuments({});
    console.log(`📊 Total de músicas no banco: ${total}\n`);

    // Mostrar algumas músicas inseridas
    console.log("🎵 Algumas músicas no banco:\n");
    const musics = await MusicCollection.find({}).limit(5).toArray();
    musics.forEach((music, index) => {
      console.log(`${index + 1}. ${music.artista} - ${music.musica} (ID: ${music.id})`);
    });

    await mongoose.connection.close();
    console.log("\n✅ Seed concluído! Conexão fechada.");
  } catch (error: any) {
    if (error.code === 11000) {
      console.log("⚠️  Algumas músicas já existem no banco (duplicatas ignoradas).");
      console.log("   Isso é normal se você já executou o seed antes.\n");
      
      const total = await mongoose.connection.collection("musics").countDocuments({});
      console.log(`📊 Total de músicas no banco: ${total}\n`);
    } else {
      console.error("❌ Erro durante o seed:", error);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedMusics();

